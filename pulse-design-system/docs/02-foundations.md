# 02 · Foundations

Exact values for color, type, layout, shape, elevation, iconography and
assets. Machine-readable versions: [tokens.css](../styles/tokens.css)
(CSS variables), [tokens.json](tokens.json) (W3C DTCG), and
[tailwind-theme.original.css](tailwind-theme.original.css) (the app's own
Tailwind v4 globals, for reference).

**Naming:** this doc uses the app's names (`--ink`, `text-ink/60`). In the
kit's CSS every variable is prefixed so it can't clash with a host project:
`--ink` → `--pulse-ink`, `ink/60` → `--pulse-ink-60`, and so on.

---

## 1. Color

### 1.1 Core palette (themed)

The light values come from reloadux.com's own `:root` (`--night`, `--smokey`,
`--grey`). The dark values are Pulse's own extension.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--ink` | `#090909` | `#f2f2f2` | Primary text. **Also** the solid fill for primary buttons, user bubble, send button, theme toggle, active pill, checked checkbox |
| `--surface` | `#ffffff` | `#0e0e0e` | Page and card background. **Also** text and icons that sit on an ink fill |
| `--tint` | `#f0f0f0` | `#1c1c1e` | Subtle fill: hover background, composer field, answered-question card, even zebra rows, active chapter pill, file-icon tile |
| `--hairline` | `#d9d9d9` | `#2c2c2e` | Every border and divider (set globally: `* { border-color: var(--hairline) }`) |
| `--muted` | `#a5a9ac` | `#8b8f94` | Captions, hints, placeholders, header status line, uppercase labels, flow-step numbers |

### 1.2 Ink opacity ladder (secondary text without new greys)

Written in Tailwind as `text-ink/80`; in CSS as `color-mix(in oklab, var(--ink) 80%, transparent)`.

| Opacity | Used for |
|---|---|
| `ink/80` | Loading-status lines next to the thinking dots; preview caption |
| `ink/70` | "✓ Analysis complete." line, answer-chip labels, suggestion links, mic icon, dropzone text, case-study problem text |
| `ink/60` | Landing nav link, chapter nav (inactive), paperclip and file icons, goal-card descriptions, answered-question prompt, "add a step" link, case-studies subtitle |
| `ink/50` | Landing explainer note, remove-file ✕, page-picker URLs |
| `ink/40` | Thinking dots; hover underline on suggestions (written for hover/focus borders too, but see §1.8) |
| `ink/5` | Focus ring (4px) on text fields |

### 1.3 Accent (report structure only)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--accent` | `#7f56d9` | `#9b7ce8` | Report section headings, eyebrows, first stat numeral, table-gradient start (callout left rule as written; renders hairline, §1.8) |
| `--accent-soft` | `rgba(127,86,217,.15)` | `rgba(155,124,232,.22)` | "Inferred" chip fill |
| `--accent-faint` | `rgba(127,86,217,.08)` | `rgba(155,124,232,.12)` | Confidence Signal callout background |

### 1.4 Report document greys

| Token | Light | Dark | Use |
|---|---|---|---|
| `--secondary` | `#565656` | `#b4b8bc` | Report body text (readable at 13px) |
| `--tertiary` | `#a5a9ac` | `#8b8f94` | Report labels, "/10" units, captions, finding references |
| `--fill` | `#f5f5f5` | `#17171a` | Scope callout, low chip, lead score cell, AI-SEO details box |
| `--rule` | `#d9d9d9` | `#2c2c2e` | Report frame, table row dividers, stat-row rules, score-grid lines |
| `--pass` | `#1f9d5b` | `#34d399` | SEO check "Pass" |
| `--warn` | `#c77700` | `#fbbf24` | SEO check "Warning" |
| `--fail` | `#c0392b` | `#f87171` | SEO check "Fail" |

### 1.5 Fixed colors (never flip)

| Value | Where |
|---|---|
| `#000000` | Dark-mode landing background; end of the table gradient |
| `#0a0a0f` | Promo / unlock card base |
| `#090909` | Text on white pill buttons sitting on dark gradients |
| `#ffffff`, `white/60`, `white/15`, `white/5` | Text, sub-text, tile borders and tile fills on dark gradient cards |
| `#1a1a1d` | `--selector-card-bg` (dark), the landing's card layer |
| `#6d28d9 → #8b5cf6 → #c4b5fd → #8b5cf6 → #6d28d9` | "Pulse" text gradient and listening-mic stroke |
| `rgba(147,90,255,.55)` / `.25` | Promo card violet glow |
| `#4a3a8f`, `#1a1430` | Table-header gradient mid-stops (28%, 58%) |
| `rgba(0,0,0,.85)` | Lightbox backdrop (plus 4px blur) |

### 1.6 Severity and scores (data colors)

Severity drives the **PDF/PPTX** exports. On screen, severity chips are monochrome (see the report doc).

| Level | Hex | Weight in score |
|---|---|---|
| Critical | `#dc2626` | 2.5 (linear) |
| High | `#ea580c` | 1.1 × √n |
| Medium | `#f59e0b` | 0.5 × √n |
| Low | `#6b7280` | 0.25 × √n |
| Suggestion | `#0891b2` (deliberately cool, not "a fainter problem") | 0 |

Score rings (`ScoreCircle`, 0–100): ≥80 emerald-600, 50–79 amber-600, <50 red-500
(Tailwind v4 oklch values in `tokens.css`). Track at 15% of the same color, 6px stroke, round caps.

### 1.7 Contrast notes
- Ink on surface: about 20:1 (light) and 17:1 (dark).
- `--muted` `#a5a9ac` on white is about 2.4:1, so use it **only** for captions,
  placeholders and labels, never paragraphs. That is why the report has
  `--secondary` for body text.

### 1.8 Border colors: as shipped vs as written

The app's `globals.css` contains an **unlayered** `* { border-color: var(--hairline) }`.
Tailwind v4 puts its utilities in a cascade layer, and unlayered rules always
beat layered ones, so **every Tailwind border-color class in the app is
overridden**. What renders, measured in both themes:

| Element | Code says | What ships |
|---|---|---|
| Secondary button, active mode pill, checked checkbox | `border-ink` | hairline |
| Every hover border (`hover:border-ink/40`) | ink 40% | hairline (background still tints) |
| Focused field / composer (`focus:border-ink`, `focus-within:border-ink/40`) | ink | hairline (the 4px `ink/5` ring still shows) |
| Landing input drag-over | ink 50% | hairline (background still tints) |
| Invalid field | red-500 | hairline (error text is still red) |
| Composer shell | hairline 60% | hairline 100% |
| Report "Medium" chip | `--secondary` | hairline |
| Confidence / scope callout left rule (3px) | violet accent | hairline |
| Unlock-card tiles | white 15% | hairline |
| Evidence highlight box | orange-500 **with `!important`** | orange (the one border that survives) |

The kit **defaults to the shipped look**. Every one of these colors goes
through a `--pulse-border-*` variable, so the written design is one attribute
away: `<html data-pulse-borders="intended">` (or on any `.pulse` element).

---

## 2. Typography

### 2.1 Families

| Family | Weights loaded | Role |
|---|---|---|
| **Manrope** (sans) | 300, 400, 500, 700 | Everything: UI, chat, body, buttons, labels, report body, logo |
| **Libre Baskerville** (serif) | 400, 400 italic, 700, 700 italic | Display only: italic for the conversation's voice, upright bold for the report |

Fallbacks: `"Manrope", system-ui, sans-serif` and `"Libre Baskerville", Georgia, serif`.
Rendering: `-webkit-font-smoothing: antialiased` on `<html>`.

### 2.2 Display treatments

| Class | Spec | Used for |
|---|---|---|
| `.font-display` | Baskerville, **italic**, weight 400 | Landing hero, promo card title "Get full audit", case-studies heading, score-ring numerals |
| `.font-report-display` | Baskerville, **upright 700**, letter-spacing −0.02em | Every report heading, report title, stat and score numerals, unlock-card title and counts |

### 2.3 Conversation type scale

Tailwind v4 defaults (size / line-height).

| Name | Size / LH | Weight | Where |
|---|---|---|---|
| Hero | 30 → 36 (≥640) → 48px (≥768) / 1.25 | 400 italic serif | Landing h1, margin-bottom 40px |
| xl | 20 / 28 | 400 | Landing logo; italic serif for card titles |
| lg | 18 / 28 | 400 | Header logo; landing input text (≥640px) |
| base | 16 / 24, chat uses 1.625 | 400 | **Chat messages**, user bubble, answered card, landing input (mobile), case-study client name (500) |
| sm | 14 / 20 | 400 / 500 | Default UI: buttons, chips, fields, composer textarea, nav items, header title (500), goal titles (500) |
| xs | 12 / 16 | 400 | Hints, header status, goal descriptions, promo body, captions |
| 2xs | 10–11px | 400 | "recommended" tag and flow badges (10px uppercase, tracking 0.025em); score-ring labels (11px) |

Uppercase labels ("CHAPTERS", question-card labels): 12px, `tracking-wide`
(0.025em), `--muted`.

Logo: "reload" weight 400 plus "**ux**" weight 700, Manrope, `tracking-tight`
(−0.025em). 20px on the landing, 18px in the header. It is a typographic
wordmark, never an image.

### 2.4 Report type scale (px-exact)

| Element | Font | Size / LH | Weight | Tracking | Color |
|---|---|---|---|---|---|
| Report title (h1) | Serif | 36 → 48px (≥640) / 1.02 | 700 | −0.02em | ink |
| Section heading `.h-sec` | Serif | 34 / 1.1 | 700 | −0.02em | **accent** |
| Topic heading `.h-black` | Serif | 34 / 1.08 | 700 | −0.02em | ink |
| Sub-heading (h3) | Serif | 24 / 32 | 700 | −0.02em | ink |
| Stat numeral | Serif | 46 / 1, tabular | 700 | −0.02em | ink (first one accent) |
| Lead score / lens score | Serif | 40 / 24px, leading 1, tabular | 700 | −0.02em | ink; "/10" tertiary 15 / 12px |
| Eyebrow | Sans | 11px | 700 | 0.16em (0.12em in callouts), uppercase | accent |
| Body `p.body` | Sans | 14 / 1.65 | 400 | — | secondary |
| Table cell | Sans | 13 / 1.5 | 400 (key column 700 ink) | — | secondary |
| Callout text | Sans | 13 / 1.6 | 400 | — | secondary |
| Finding title | Sans | 15px | 700 | — | ink |
| Finding text | Sans | 12.5 / 1.55 | 400 | — | secondary (observation), ink (why, fix) |
| Stat label | Sans | 11.5px | 400 | — | secondary |
| Caption | Sans | 11px | 400 | — | tertiary |
| Table header | Sans | 10px | 700 | 0.1em, uppercase | white |
| Score label | Sans | 10px | 400 | 0.06em, uppercase | tertiary |
| Finding reference | Sans | 10px | 400 | — | tertiary |
| Chip | Sans | 9.5px | 700 | 0.08em, uppercase | per band |

---

## 3. Layout

### 3.1 Breakpoints (Tailwind defaults)
`sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280. The side rails appear only at **≥1280px**.

### 3.2 Landing
- Full-height flex column with the themed backdrop (`.selector-bg`).
- Top bar: container `max-width: 72rem`, `padding: 40px 24px 0` (64px top at
  ≥640). Logo on the left, a "reloadux.com" text link on the right (14px, `ink/60`).
- Hero block: vertically centred in the remaining height, the same 72rem container,
  content column `max-width: 42rem`, bottom padding 40 / 64px.
- Stack: hero (mb 40px), input, note (mt 40px, 14px, `ink/50`).
- Floating theme toggle: fixed, 24px from bottom-right, 44px.

### 3.3 Audit thread
- Sticky glass header (full width, `padding: 16px 24px`).
- `main`: `padding: 40px 24px 224px` (the bottom padding clears the floating
  composer). Max width **60rem** before the report and **90rem** once the report
  exists.
- With the report, at ≥1280px: a 3-column grid `14rem | minmax(0, 52.5rem) | 14rem`,
  gap 32px (24px below xl). Both rails are `position: sticky; top: 6rem`.
- Center column: max **52.5rem (840px)**, children spaced **32px** apart
  (`space-y-8`). Inside a stage: 12px (`space-y-3`) between a bubble and its
  attachments, 24px (`mb-6`) between stage blocks.
- AI attachment indent: **44px** (`ml-11`).
- Composer: fixed, 24px from bottom, centred, max 44.1rem, 24px side gutters.
- Report sections use `scroll-margin-top: 6rem` so chapter jumps clear the header.

### 3.4 Spacing rhythm
Tailwind's 4px grid. The values that recur:
`4 · 6 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 64 · 224`.

| Spacing | Typical use |
|---|---|
| 8px | Gap between chips and pills; mic/send gap; icon-to-label gap |
| 12px | Avatar-to-text gap; input inner gap; buttons in a row |
| 16px | Card padding (goal cards, picker rows); composer shell padding |
| 20–24px | Large input padding; callout padding; page gutter |
| 32px | Between thread items; report section bottom margin |
| 40px | Hero margin; report header bottom margin; thread top padding |
| 48px | Report document padding (≥640) |

### 3.5 Z-index
Lightbox 100 · floating theme toggle 40 · composer 30 · header 20 · landing content 10.

---

## 4. Shape

| Radius | px | Applied to |
|---|---|---|
| `rounded-full` | 9999 | **All buttons**, chips, pills, avatar, theme toggle, icon buttons, status badges |
| `rounded-3xl` | 24 | Landing input, composer shell and inner field, chapters card, promo card, answered-questions card |
| `rounded-2xl` | 16 | User bubble (with a **6px top-right**), text fields, dropzones, goal cards, flow list, page picker, case cards, preview images |
| `rounded-xl` | 12 | Chapter nav items and active pill, evidence crops |
| `rounded-lg` | 8 | 40px thumbnails, file tiles |
| `rounded-md` | 6 | Checkboxes, the user-bubble tail corner |
| `0` | — | **Report document, its tables, callouts, stat rows, score grid, unlock card, teaser tiles, additional-page rows** |

Borders are always **1px**, except the landing input (**2px**) and callout left
rules (**3px**). Their color is always hairline as shipped (§1.8).

---

## 5. Elevation and materials

| Token | Value | Used on |
|---|---|---|
| `shadow-soft` | `0 4px 28px rgba(0,0,0,.06)` | Sticky header, composer shell, primary buttons, flow list, preview image, active mode pill, landing send button; hover state of case cards |
| `shadow-soft-lg` | `0 8px 40px rgba(0,0,0,.08)` | Landing input, chapters card, floating theme toggle, promo avatar; **hover** state of primary/CTA buttons |
| Header glass | `surface` 85% + `backdrop-filter: blur(12px)` | Thread header |
| Composer glass | `surface` 50% + `blur(24px)`, hairline border | Composer shell |
| Focus ring | `0 0 0 4px ink/5` (border stays hairline as shipped) | Text fields |

No other shadows exist. Dark mode keeps the same shadow values; they mostly
disappear against dark surfaces, and that is intended.

---

## 6. Iconography

**lucide-react** outline icons, always **16px** (`h-4 w-4`) unless noted.
Stroke width varies by context and is part of the look:

| Icon | Where | Stroke |
|---|---|---|
| `ArrowRight` | Landing send | 2 |
| `ArrowUp` | Composer send; flow "move up" | 2 / default |
| `Paperclip` | Landing attach | 1.75 |
| `X` | Remove file (1.75); lightbox close (20px) | 1.75 / default |
| `FileText` | Attached PDF tile (20px) | 1.5 |
| `Mic` | Composer voice | 2 |
| `Sun` / `Moon` | Theme toggle | 1.5 |
| `Check` | "Analysis complete."; checkbox tick (14px, stroke 2.5) | default / 2.5 |
| `Download` | Download PDF (14px) | 2 |
| `ChevronLeft` / `ChevronRight` | Case-study nav | 1.5 |
| `ChevronDown` | Accordions (rotates 180°) | default |
| `Upload` | Dropzones | 1.5 |
| `GripVertical`, `ArrowDown`, `Trash2`, `Plus` | Flow editor | default |

Icons inherit `currentColor`. Default lucide stroke is 2.

---

## 7. Imagery and assets

All in [../assets/](../assets/):

| File | Spec | Use |
|---|---|---|
| `images/avatar-icon.png` | 110×111, circular "UX" mark with a violet ring | AI avatar at 32px (48px on the promo card) |
| `images/reload-engine-bg-light.png` | 2203×1422, iridescent glass ring on light grey | Light landing: `background-size: cover; position: center` on `#d9d9d9` |
| `images/reload-engine-bg-dark.png` | 2203×1422, chrome/prism ribbon on transparent | Dark landing: `size: min(60vw, 1040px); position: bottom right` on `#000` |
| `fonts/woff2/*` | Manrope 300/400/500/700, Baskerville 400/700 ± italic (latin) | Web |
| `fonts/ttf/*` | Manrope 400/700, Baskerville 400/700 | PDF rendering (react-pdf cannot read woff2) |

Screenshots shown in the thread are cropped `object-cover object-top` inside
rounded, hairline-bordered, `shadow-soft` frames (224px tall). Evidence
highlights: a 2px orange-500 outline box with a `0 0 0 9999px rgba(0,0,0,.45)`
mask that dims everything around it.

Reference captures of the real app are in [../reference/](../reference/).
