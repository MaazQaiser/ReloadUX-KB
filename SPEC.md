# reloadux Project Intelligence Agent: Build Spec

## Overview

An internal web app where the reloadux team asks, in plain language, whether we have done a kind of project before, and gets a yes with the matching projects, details, links and visuals, or a clear no with the closest match. It covers 100+ projects, is used only by the internal team (sales and designers), and is built by one person with Claude Code.

The agent must answer three kinds of questions:

| Kind | Example questions |
| --- | --- |
| Matching (yes / no) | Have we done a healthcare chatbot? Any AI-native onboarding flows? Did we design a marketing post creation flow? |
| Project detail | Share the Figma link for Vocable. Who was the designer on the HRMS project? When was it delivered, and to whom? What was the timeline? Is it a web app, mobile app or branding only? Summarize what we did. |
| Lists and visuals | Show onboarding screens from healthcare apps. List all mobile apps delivered in 2025. Which fintech projects did Sara lead? |

Three more capabilities sit around the agent: a form and an admin chat to add or edit projects, a visual library of uploaded screenshots, and a learning loop that turns unanswered questions into new, verified knowledge.

Answer rules: never invent a project, link, date or person; always link the project record; when nothing matches, say so and offer the closest match with why it is close.

## Architecture and stack

One Next.js app does everything: the UI, the agent API and the background jobs, all writing to one MongoDB database, with images in R2.

```
Inputs:   Notion + Sheets (one-time import) | Screenshot uploads | Form + admin chat
             \                  |                    /
              v                 v                   v
Ingest jobs:  extract with Claude, caption images, embed with Voyage
              |                                   |
              v                                   v
MongoDB Atlas (projects, vectors, people, logs)   Cloudflare R2 (screenshots, thumbnails)
              |                                   |
              +---------------> Agent: Claude + 6 tools <---+
                                  |            |
                                  v            v
                     Review queue (gaps)    Ask screen (web app, Google sign-in)
                     approved fixes update MongoDB records
```

All three inputs pass through the same ingest step, and unanswered questions loop back through the review queue into the records.

| Layer | Choice | Why |
| --- | --- | --- |
| App (front and back end) | Next.js App Router, TypeScript, Tailwind, shadcn/ui | One codebase, well supported by Claude Code |
| Hosting | Vercel | Simple deploys, built-in cron |
| Long jobs | Inngest or Trigger.dev | Migration and bulk imports can outlast serverless time limits |
| Login | Firebase Authentication with Google; server-verified session cookie, roles stored in MongoDB | Internal-only access with roles; Auth Emulator for end-to-end tests |
| Database | MongoDB Atlas with Vector Search and Atlas Search | Records, vectors, keyword search and logs in one place |
| Files | Cloudflare R2 | Cheap image storage, no egress fees |
| LLM | Claude via Anthropic API | Tool use for the agent, vision for captions |
| Embeddings and rerank | Voyage AI | Strong retrieval quality, reranker included |
| Integrations | Notion API, Google Sheets API, Google Drive API | One-time import and bulk screenshot import |

## Project data model

Each project is one MongoDB document, and the new database is the single source of truth (Notion and Sheets are a one-time import). Fields with a fixed list of values use controlled tags so filters stay reliable.

| Group | Field | Type / allowed values |
| --- | --- | --- |
| Basics | name, slug, client_name | text |
| Basics | industry | tag: healthcare, fintech, SaaS, HR, marketing, e-commerce, education, legal, gaming, other |
| Basics | country, status | text; tag: ongoing, delivered, paused, cancelled |
| Basics | nda | boolean |
| Type | product_types | multi-tag: website, web app, mobile app iOS, mobile app Android, cross-platform app, dashboard, design system, branding only |
| Scope | services | multi-tag: research, UX audit, UX/UI design, redesign, branding, prototyping, usability testing, dev handoff, front-end code |
| Scope | ai_features | multi-tag: chatbot, conversational AI, agentic workflow, AI onboarding, content generation, recommendations, AI search, none |
| Scope | flows | multi-tag: onboarding, signup, posting / content creation, checkout, dashboard, settings, booking, messaging, reporting (extendable) |
| Audience | business_model | multi-tag: B2B, B2C, B2B2C, internal tool (extendable) |
| Audience | personas | list of short text, up to 10 ("Finance lead at a mid-size firm") |
| People | lead_designer, designers, account_manager | references to a people collection |
| People | delivered_to | client contact name and role |
| Timeline | start_date, delivery_date, duration_weeks | dates; number |
| Timeline | milestones | list of {name, date} |
| Links | figma_files, prototype_url, live_url, case_study_url, drive_folder | list of {label, url} |
| Visuals | visuals | references to the visuals collection |
| Story | summary, challenge, what_we_did, outcomes, testimonial | long text |
| Story | metrics | list of {label, value} |
| Client-safe | public_summary | anonymized text for proposals |
| System | search_text, embedding, updated_by, updated_at, review_status | generated by the app |

**Collections:**

- **projects**: the records above, with a vector index on embedding and a text index on search_text.
- **project_chunks**: long story fields split into 300 to 800 token chunks, each with project_id and its own embedding, so long write-ups stay searchable.
- **visuals**: one per screenshot: project_id, image and thumbnail URLs in R2, source (upload or drive import), optional figma_link, auto caption, tags (screen type, flow, platform), embedding.
- **people**: designers and account managers, so "who designed" and "what did Sara lead" are exact lookups.
- **conversations**: every chat with tools called, projects returned and feedback.
- **knowledge_gaps**: unanswered or thumbs-down questions waiting for review.
- **verified_answers**: approved question and answer pairs the agent prefers next time.
- **users**: Google account (Firebase uid and email), role (viewer, editor, admin).

## Agent tools and answer rules

The agent is Claude with tool use, not a single retrieve-then-answer step: it picks the right tool per question, can call several in a row, and only states facts that came back from a tool.

| Tool | Use for | How it works |
| --- | --- | --- |
| search_projects(query, filters?) | "Have we done X?" | Hybrid search: vector search on projects and chunks plus keyword search, filtered by tags (industry, product_types, ai_features, flows), then reranked. Returns top 5 with a match score and why each matched. |
| get_project(name or id) | Exact details | Fuzzy name lookup, returns the full record: people, dates, links, summary. |
| list_projects(filters, sort?, limit?) | Lists and counts | Plain database query: "mobile apps delivered in 2025", "projects Sara led". |
| find_visuals(query, project_id?, filters?) | "Show me screens" | Vector search over visual captions, returns thumbnails with their project and Figma link. |
| get_verified_answer(query) | Repeat questions | Checks approved answers first; used when similarity is high. |
| log_gap(question, reason) | Unknowns | Records questions it could not answer for the learning loop. |

**Answer rules (system prompt):**

1. Matching questions start with a verdict: **Yes**, **Partly** (similar but not exact) or **No**, then the projects as cards with name, type, industry, one-line why it matches, and links.
2. Never invent a project, link, date, client or person. A missing field is stated as "not recorded" and logged as a gap.
3. On No, give the closest match and what differs ("No healthcare chatbot, but Elia Wellness is a healthcare platform and Vocable has conversational AI").
4. NDA projects show full details internally; when the user asks for client-safe or proposal text, use public_summary only.
5. Every answer lists the project records it used, so the team can click through and verify.
6. Match the reloadux voice: direct, short sentences, no hype.

## Visuals pipeline

Visuals come from manual uploads plus a one-time bulk import; Figma is stored only as plain links on each project, with no Figma API.

**Uploads (per project):**

1. Editors drag and drop images on the project page or form (PNG, JPG, WebP, PDF pages). The server checks file type and a 10 MB limit.
2. Each image is resized into a web version and a thumbnail, and both are stored in Cloudflare R2 under `projects/<slug>/`.
3. Claude's vision model writes a caption and tags for each image ("Mobile onboarding, step 2: choose health goals"; screen type, flow, platform). The caption is embedded into the visuals collection.
4. Editors can correct captions and tags, pick a cover image and reorder the gallery.
5. Each image can carry an optional Figma link, copied with Figma's "Copy link to selection", so people can jump to the source frame.

Needs: only the R2 bucket. No Figma account or token.

**Designer habit:** at delivery, the lead designer uploads 3 to 8 key final screens. Make this part of the project close-out checklist so the library stays current.

**Collecting scattered screenshots (one-time):** create a shared Drive folder with one subfolder per project name, ask designers to drop finals there over two weeks, then run a bulk import script that matches folder names to projects and uploads them. Unmatched folders land in a review list.

## Data entry: form and admin chat

Both entry paths write to the same projects collection through the same validation, and nothing goes live until an editor approves it.

**Project form (editors and admins):**

- Sections mirror the data model: Basics, Type and scope, People, Timeline, Links, Visuals, Story, Client-safe.
- Tag fields are multi-select chips from the controlled lists; admins can add new tag values in Settings.
- People fields pick from the people collection; new people are added inline.
- A "Fill from text" button: paste a brief, proposal or case study and Claude pre-fills the fields for review.
- Saving re-generates search_text, chunks and embeddings, and captions any new images.

**Admin chat intake:**

1. The editor types something like "We just delivered a fintech onboarding web app for Fintua, Sara led it".
2. The agent extracts what it can into a draft record and asks only for missing required fields (delivery date, product type, Figma link).
3. It shows a preview card of the draft with every field, and the editor confirms or corrects.
4. On approval the record saves, exactly like the form. The agent can also edit: "change the Vocable delivery date to 12 March 2026" shows a before and after diff to confirm.

Required fields: name, industry, product_types, status, lead_designer, summary. Everything else is optional but shown as a completeness score per project, so gaps are visible.

## Learning loop

The agent improves through its data and feedback, not by retraining the model, and every new piece of knowledge passes a human approval step so it never teaches itself something wrong.

1. **Capture:** every answer has thumbs up / down and an optional "what was wrong" note. Tool calls and returned projects are logged in conversations.
2. **Detect gaps:** a question goes to knowledge_gaps when the agent says No with low confidence, a field is "not recorded", the user gives a thumbs down, or the user rephrases the same question within a minute.
3. **Review queue:** admins see gaps grouped by theme weekly (for example, 6 questions about Webflow projects). Each gap is resolved by fixing a project record, adding a missing project, adding a tag value, or writing a verified answer.
4. **Verified answers:** approved question and answer pairs are embedded; when a new question is very similar, the agent uses the verified answer as its starting point and still checks the linked records are current.
5. **Tag suggestions:** a weekly job asks Claude to read new projects and propose missing tags ("this project has an onboarding flow but no onboarding tag"); editors accept or reject.
6. **Evaluation set:** 50 test questions with expected projects, run after every change to prompts, tags or search settings. Track: correct project in top 3, correct yes / no verdict, no invented facts. Ship a change only if scores hold or improve.
7. **Analytics page:** questions per week, thumbs-up rate, top unanswered topics, least complete projects.

## Migration from Notion and Sheets

Migration is a one-time, AI-assisted import with human review, after which the team stops editing project data in Notion.

1. **Connect:** create a Notion internal integration and share the project pages and databases with it; create a Google Cloud service account and share the sheets with its email.
2. **Export raw:** a script pulls every Notion page (blocks to markdown, properties as JSON) and every sheet row into a staging collection, untouched.
3. **Group:** Claude clusters staging items by project, since one project may have a Notion page, a sheet row and a case study page on the site.
4. **Extract:** for each project, Claude fills the data model from all its sources, marks each field with the source it came from, and flags conflicts (two different delivery dates).
5. **Review:** drafts appear in a migration queue in the app; an editor checks, fixes and approves. At 100+ projects, plan about 10 minutes each, split across the team.
6. **Website enrichment:** case study pages from reloadux.com are fetched and attached as story text and case_study_url.
7. **Cutover:** after approval, mark Notion project pages read-only and add a note pointing to the new app.

Allow re-running steps 2 to 4 during the first weeks, matched by project slug, so late Notion edits are not lost.

## Screens

The app has nine screens, styled in the reloadux look (lowercase wordmark, clean and minimal).

| Screen | Who | What it does |
| --- | --- | --- |
| Login | All | Google sign-in |
| Ask (home) | All | Chat with starter questions; answers show a Yes / Partly / No verdict, project cards, thumbnails, links, thumbs up / down |
| Projects | All | Searchable, filterable grid by industry, type, AI feature, flow, designer, year |
| Project detail | All | Full record, visuals gallery with Figma links, timeline, people, links, completeness score |
| Visual library | All | Search screens across all projects ("healthcare onboarding") |
| Add / edit project | Editor | The form, with "Fill from text" and image uploads |
| Admin chat | Editor | Conversational add and edit with preview and diff |
| Review queue | Admin | Migration drafts, knowledge gaps, tag suggestions, verified answers |
| Settings and analytics | Admin | Users and roles, tag lists, eval scores, usage stats |

## Build plan

Build in six phases of roughly one week each, shipping something usable from phase 3 on. Follow CLAUDE.md for all engineering rules.

1. **Foundation (week 1):** Next.js app, Google sign-in with domain restriction and roles, MongoDB connection, the projects and people models with validation, the Projects grid and Project detail pages, seed data.
2. **Data entry (week 2):** the project form with tag chips, Fill from text, embeddings on save, Atlas vector and text indexes.
3. **Agent (week 3):** the Ask screen, Claude with the six tools, streaming answers, project cards, feedback buttons, and the 50-question eval set with a runner.
4. **Migration (week 4):** Notion and Sheets export, grouping, extraction and the review queue; import the 100+ projects.
5. **Visuals (week 5):** R2 storage, image uploads with resizing, captioning, Visual library, find_visuals tool, bulk Drive import.
6. **Learning and admin (week 6):** admin chat intake, knowledge gaps, verified answers, tag suggestions, analytics.

**Accounts and keys checklist:**

- [ ] MongoDB Atlas cluster (free tier to start) with Vector Search enabled
- [ ] Anthropic API key
- [ ] Voyage AI API key (embeddings and reranker)
- [ ] Cloudflare R2 bucket and access keys
- [ ] Google Drive folder with one subfolder per project for the screenshot collection
- [ ] Notion internal integration token, pages shared with it
- [ ] Firebase project (same Google Cloud project) with Google sign-in enabled, plus a Firebase Admin service account key
- [ ] Google Cloud service account for Sheets
- [ ] Vercel project for hosting, plus a cron for weekly jobs
- [ ] GitHub repo with SPEC.md and CLAUDE.md

**Running costs (approximate, check current pricing):** hosting, database and storage fit in free or low tiers at this size; the main cost is API usage for Claude and embeddings, which scales with how many questions the team asks. Embedding 100+ projects once is cheap; captioning images is a one-time cost per image.

## Decisions log

Decisions made after the original spec, approved by the project owner.

| Date | Decision |
| --- | --- |
| 2026-10-09 | Auth uses Firebase Authentication (Google provider) instead of Auth.js; the server verifies tokens with `firebase-admin` and issues session cookies. Roles live in the MongoDB `users` collection. |
| 2026-10-09 | Sign-in is restricted to `reloadux.com` email addresses (verified email, checked on the server). |
| 2026-10-12 | Domain restriction removed. Any verified Google account can sign in. |
| 2026-10-13 | New accounts start with the `pending` role and see nothing until an admin approves them in Settings. Admins can't change their own role. |
| 2026-10-09 | New users get the `viewer` role (superseded 2026-10-13: they start as `pending`). Initial admins come from the `INITIAL_ADMIN_EMAILS` environment variable. |
| 2026-10-09 | Tag lists live in `src/lib/constants.ts` until phase 6, when they move to a database collection seeded from those constants so admins can add values in Settings. |
| 2026-10-09 | Tag values are stored as stable keys (for example `mobile_app_ios`) with display labels kept alongside the key lists. |
| 2026-10-09 | **people** fields: name, slug, email (optional), roles (designer, account_manager), active. |
| 2026-10-09 | `review_status` values: draft, approved. Projects and people get `deleted_at` for soft delete. |
| 2026-10-09 | Seed data uses about 8 fictional projects, never real client data. |
| 2026-10-09 | Integration tests use `mongodb-memory-server`; signed-in e2e tests use the Firebase Auth Emulator. |
| 2026-10-27 | Projects gain an Audience group: `business_model` (extendable tag list: B2B, B2C, B2B2C, internal tool) and `personas` (up to 10 short texts). Both are optional, count towards completeness, feed search_text, and business model is a Projects filter. SaaS stays an industry value. |
| 2026-10-09 | Until Atlas Search arrives in phase 2, the Projects grid search is a case-insensitive match on name and client, and the "year" filter means delivery year. |
