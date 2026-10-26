# 04 · Chat experience

How the conversation behaves: its structure, its states, its timing and its
words. The visual specs for each piece are in [03-components.md](03-components.md).

---

## 1. The model: one thread, not a wizard

The whole audit, from input through intake and analysis to the report, plays
out as **one continuous conversation on one page** (`/audit/[id]`). There are no
step routes, no progress bar and no "Next" buttons.

- Each **stage** is a component that is in one of three states:
  1. **not reached**: renders nothing;
  2. **live**: interactive, and it owns the composer;
  3. **resolved**: collapses into a read-only summary further up the thread,
     usually an AI line plus the user's answer as a user bubble or answered card.
- The thread therefore reads as a real back-and-forth history.
- The **report appears inline** as the AI's final turn, then the same composer
  turns into a Q&A box about the report.

```
[sticky glass header: logo ……………… Audit title / live status · ◐]

 (UX) Got it, here's what I'll be working from
      ┌──────────────┐
      │ page preview │   ← 44px indent, rounded, shadow-soft
      └──────────────┘
      From reviewing your URL, you run …     ← text-sm ink/80

                         ┌───────────────────────────────────────┐
                         │ > Is there a specific goal …?          │ ← answered card (tint, r24)
                         │ (skipped)                              │
                         └───────────────────────────────────────┘
 (UX) ✓ Analysis complete.

 ┌───────────────────────── REPORT (square, ruled) ─────────────┐
 │ PULSE · HEURISTIC ANALYSIS                    [⤓ Download PDF]│
 │ reloadux.com                                                  │
 │ The Summary …                                                 │
 └───────────────────────────────────────────────────────────────┘
 (UX) Ask me anything about this report.
      What are the major findings?   ← underlined suggestions
                 ┌──────────────────────────────────────────┐
                 │ ╭ Ask Pulse ……………………………… (🎙)(↑) ╮ │ ← floating glass composer
                 └──────────────────────────────────────────┘
```

With the report present and at ≥1280px, a **Chapters** card (left) and a
**Get full audit** card (right) float sticky beside the 840px column.

---

## 2. Journey and states

| # | Stage | What the AI shows | What the user does | Header status | Composer |
|---|---|---|---|---|---|
| 0 | **Landing** (`/`) | Hero "Hello, I am Pulse…" | Paste a URL or attach/drop an image or PDF; Enter or → | — | — (the landing input is the composer here) |
| 1 | **Input** (draft) | While auto-submitting: status line `Reading the page…` + dots. Then "Got it, here's what I'll be working from" + preview + one-paragraph business read | Nothing (auto from landing), or choose a mode with the pills + fill fields + primary button | Gathering input | **Hidden** (the stage has its own UI) |
| 1b | **Mode mismatch** | "{Audit} works best with URL or Image…", or the accessibility variant: "…Want to share the URL too, or continue with just the visual review?" | Primary "Add URL too" / secondary "Continue with visual review only" | Gathering input | Hidden |
| 2 | **Blocked** (guardrail) | Auth wall: "I took a look at **site**, but it's sitting behind a sign-in screen…". Nothing to audit: "I went through **site** but didn't find anything to work with — …". Missing business context: the guardrail's own message plus "What I still need: …" | Primary "Try a different URL" / "Upload a different image" / "Upload a different PDF" / "Share a different input"; secondary "Audit it anyway" (while sending: "One sec…") | Needs a decision | Live: "Type your answer…" |
| 3 | **Flow confirm** (flow mode) | "Here's what I'm seeing: a {n}-step {uploaded} flow. Did I get this right?" + an editable zebra list of steps | Rename, reorder, delete, or "Something's missing, add a step"; primary "Looks right, confirm" (while saving: "Saving…") | Confirming the flow | Disabled: "Confirm the flow above to continue…" |
| 4 | **Intake** | Business summary first (status line while fetching), then one or two questions, one at a time | Click a chip or goal card, type a free answer, or Skip | A couple of questions | Live: "Type your answer, or pick one above…" / goal question: "Optional — type a goal, or skip…"; chips slot holds suggestion chips + Skip, or goal cards |
| 4→5 | **Auto-start** | After the last answer the same bubble keeps its status line going; **900ms** later the run starts by itself (no "Run" button) | — | Running the analysis | Disabled: "Thinking about what you've shared…" |
| 5 | **Running** | Status line cycling the playful phrases every **2.4s** + dots | Wait | Running the analysis | Disabled: "Working on it…" |
| 5x | **Run failed** | "Something went wrong while running the analysis — this can happen on a slow or unresponsive page. No progress was lost; it's safe to try again." + primary retry | Retry | Running the analysis | Disabled |
| 6 | **Complete** | "✓ Analysis complete." (spring pop), then the report document, then "Ask me anything about this report." + 4 underlined suggestions | Ask a question, or click a suggestion | Report | Live: "Ask Pulse"; while answering: "Thinking…" (disabled) and a dots-only AI turn |
| 6+ | **Q&A** | Each Q&A appends a user bubble + an AI answer (12px apart; 32px between pairs) | — | Report | Live |

Composer rule: **always mounted** (stage 1 excepted). When no stage owns it, it
is disabled with a placeholder that says what's happening above it.

Disabled placeholders by status: draft "Share your input above to get started…" · blocked "Choose an option above to continue…" · flow "Confirm the flow above to continue…" · intake "Thinking about what to ask next…" · running "Working on it…".

---

## 3. Waiting states (the personality lives here)

Pattern: **AI turn → `[cycling phrase] [● ● ●]`** in `ink/80`. Never a spinner, never a percentage.

**Input / business-understanding phrases** (2.2s each):
```
Reading the page…
Fetching details…
Capturing every UX point…
Looking at colors and typography…
Mapping the layout…
Checking accessibility signals…
```

**Running phrases** (2.4s each):
```
Give me a moment, putting this audit together.
Squinting at your button hierarchy…
Counting how many clicks to checkout…
Interrogating your color contrast…
Reading between the pixels…
Weighing severity like a tiny judge…
Sniffing out missing alt text…
Untangling your navigation…
Measuring whitespace with a ruler…
Cross-examining your calls-to-action…
Tracing every dead-end click…
Politely judging your form labels…
Peeking under the hood of your DOM…
Making sure nothing's hiding in the footer…
Double-checking our double-checking…
```
Each phrase swaps with a 6px vertical slide plus a fade (300ms). The line is
allowed to reflow (unlike the hero's cycling word).

Page loads have **no loader**: the thread renders the moment data exists. The
landing hands its freshly created audit straight to the thread page, so there
is no flash.

---

## 4. Copy deck

### Landing
- Hero: *Hello, I am* **Pulse***, I can do quick audit for your* {Website · App · Product · SaaS}
- Input placeholder: **Paste a URL**
- Invalid hint: That doesn't look like a full URL yet — try starting with http:// or https://.
- Note: Every audit runs the basic tier: hand over a URL, image, PDF, or flow of screenshots, answer one or two questions, and get a findings report with a recommendation for each issue.
- Nav link: reloadux.com

### Thread
- Input acknowledged: **Got it, here's what I'll be working from**
- Mode labels: URL · Image · PDF · Flow of screenshots · Pasted text (+ "recommended" tag)
- URL hint: Only a live URL lets us check the page's SEO and GEO (AI answer-engine) signals.
- Field labels: Page URL · Live URL · Pasted copy · Upload an image / a PDF
- Dropzones: Choose a file… / Choose files… → "Selected: {name}" / "{n} screenshots selected"
- Goal question: **Is there a specific goal or outcome you'd like this audit to speak to?**
- Goal footnote: Or type your own goal in the box below.
- Skipped answer renders as: (skipped)
- Answered cards prefix each question with `> `.
- Flow intro: Here's what I'm seeing: a {n}-step {uploaded / Signup & Onboarding} flow. Did I get this right?
- Flow confirm: **Looks right, confirm** → the user bubble reads "Looks right, confirmed."
- Gap step note: Flagged as a gap, not represented in the uploaded screenshots, treated as untested.
- Blocked re-ask questions:
  - What does your business do, and who is it for?
  - What's the main goal of your website, and how does the business make money?
  - What makes you different from competitors, and how would you describe your brand's tone or key message?
- Done: **Analysis complete.**
- Post-report: **Ask me anything about this report.**
  - What are the major findings?
  - What are the minor findings?
  - What's the single biggest risk here?
  - What should I fix first?

### Rails and CTAs
- Chapters card title: Chapters
- Promo: **Get full audit** — This basic scan catches the obvious stuff. A full ReloadUX audit goes deeper: goal-mapped findings, root-cause analysis across five expert lenses, and a fix-it roadmap your team can act on. → **Talk to an expert**
- Report end: Your report is ready to download → **Download PDF** (while generating: "Preparing…")

---

## 5. Interaction rules

1. **One question at a time.** Intake never shows a form with several fields.
2. **Choices as chips, free text always allowed.** Chips submit on click; the
   composer accepts anything typed.
3. **No "Go" buttons when nothing is left to decide.** Intake auto-starts the run after 900ms.
4. **Resolved stages collapse to dialogue.** The user's choices become user
   bubbles or the answered card, never a form recap.
5. **Overrides are explicit.** When a guardrail blocks, the user chooses
   (try again or audit anyway); nothing silently downgrades.
6. **Voice input is progressive.** The mic shows only where the browser supports
   speech recognition, and it stops when the composer disables.
7. **Enter sends, Shift+Enter adds a new line**; the textarea auto-grows to 200px, then scrolls.
8. **Everything fades and rises in once**, on mount or the first time it scrolls
   into view. Nothing re-animates on re-render.
