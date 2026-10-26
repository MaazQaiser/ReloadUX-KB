# 03 · Components

Every component in the app, with its **exact Tailwind v4 class string** (copied
from the source, for reference) and its plain-CSS class in
[../styles/components.css](../styles/components.css). You don't have to rebuild
any of these: the ready-made React versions are in [../react/](../react/) (see
the README for the list). Motion values: [../react/motion.ts](../react/motion.ts)
and [06-motion-reference.md](06-motion-reference.md).

Conventions: `ink/60` means ink at 60% opacity. "Pressable" means framer
`whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}`.

> **Border colors:** any `border-ink…`, `hover:border-…`, `focus:border-…` or
> `border-red-500` class below is what the source *says*; in the shipped app
> all of them render as the hairline grey (see 02-foundations §1.8). The kit's
> CSS reproduces the shipped look by default.

---

## Brand

### Logo — `.rx-logo`
```html
<span class="font-sans tracking-tight text-xl"><span class="font-normal">reload</span><span class="font-bold">ux</span></span>
```
`text-xl` on the landing, `text-lg` in the header (where it links to `/`).

### AI avatar — `.rx-avatar`
```html
<img src="/avatar-icon.png" alt="ReloadUX" class="h-8 w-8 rounded-full flex-shrink-0 object-cover">
```
On the promo card: `h-12 w-12 mb-4 shadow-soft-lg`.

---

## Buttons

| Variant | Classes | Motion |
|---|---|---|
| **Primary** `.rx-btn--primary` | `rounded-full font-sans text-sm px-6 py-3 bg-ink text-surface shadow-soft disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none` | Pressable |
| **Secondary** `.rx-btn--secondary` | `rounded-full font-sans text-sm px-6 py-3 border border-ink text-ink transition-colors duration-300 hover:bg-ink hover:text-surface disabled:opacity-30 disabled:cursor-not-allowed` | Pressable |
| **Report CTA** `.rx-btn--report` | `inline-flex items-center justify-center gap-2 font-sans font-bold text-sm px-6 py-3 rounded-full bg-ink text-surface shadow-soft transition-shadow duration-300 hover:shadow-soft-lg disabled:opacity-60` (final CTA: `px-7 py-3.5`) + `Download` icon 14px, stroke 2 | hover scale 1.04, tap 0.96 |
| **White on gradient** `.rx-btn--white` | `inline-block w-full font-sans text-sm px-6 py-3 rounded-full bg-white text-[#090909] shadow-soft transition-shadow duration-300 hover:shadow-soft-lg` (unlock card: `font-bold px-7 py-3.5`) | hover 1.04 / tap 0.96 (unlock 1.03 / 0.97) |
| **Text link button** | `flex items-center gap-2 text-sm text-ink/60 hover:text-ink font-sans transition-colors duration-300` | — |

Buttons in a row: `flex gap-3 mt-4 flex-wrap`.

### Icon buttons
| Name | Classes |
|---|---|
| Landing send (44) | `flex-shrink-0 h-11 w-11 rounded-full bg-ink text-surface shadow-soft flex items-center justify-center transition-all duration-300 hover:enabled:shadow-soft-lg disabled:opacity-30 disabled:cursor-not-allowed` · `ArrowRight` 16/2 · hover `x: 2`, tap 0.94 (enabled only) |
| Landing attach (44) | `flex-shrink-0 h-11 w-11 rounded-full flex items-center justify-center border border-hairline text-ink/60 transition-colors duration-300 hover:border-ink/40 hover:bg-tint disabled:opacity-30 disabled:cursor-not-allowed` · `Paperclip` 16/1.75 · shown only while the input is empty |
| Composer send (40) | `flex-shrink-0 h-10 w-10 rounded-full bg-ink text-surface flex items-center justify-center transition-all duration-300 hover:enabled:shadow-soft hover:enabled:scale-105 active:enabled:scale-90 disabled:opacity-30 disabled:cursor-not-allowed` · `ArrowUp` 16/2 |
| Composer mic (40) | `flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 border border-hairline bg-surface text-ink/70 hover:border-ink/40 hover:bg-tint disabled:opacity-30` · `Mic` 16/2 · listening: gradient stroke + scale pulse. Render only where the Web Speech API exists |
| Carousel nav (36) | `h-9 w-9 flex items-center justify-center rounded-full border border-hairline transition-colors duration-300 hover:border-ink/40 hover:bg-tint` · chevrons 16/1.5 · hover 1.08, tap 0.9 |
| Remove file (32) | `flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-ink/50 transition-colors duration-300 hover:bg-tint hover:text-ink` |

### Theme toggle — `.rx-theme-toggle`
- **Floating** (landing): `fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-ink text-surface shadow-soft-lg transition-opacity duration-300 hover:opacity-90`
- **Header** (thread): `relative flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-ink text-surface transition-opacity duration-300 hover:opacity-90`
- Icon `Sun` in light mode and `Moon` in dark mode (16px, stroke 1.5), swapped with a rotate/scale/fade (250ms). Hover y −2, tap 0.92. Render nothing inside until after hydration to avoid a flash.

---

## Landing

### Hero — `.rx-hero`
```html
<h1 class="font-display text-3xl sm:text-4xl md:text-5xl leading-tight mb-10">
  Hello, I am <span class="pulse-gradient-text">Pulse</span>, I can do quick audit for your <CyclingWord words={["Website","App","Product","SaaS"]} />
</h1>
```
Keep the copy exactly, including "quick audit" with no article: it is part of the brand voice.

**CyclingWord**: `inline-grid`. An invisible copy of the longest word holds the
width; the visible word swaps every 2400ms (in: opacity 0→1, y 10→0; out: y →−10;
350ms easeInOut). The line never reflows.

### Landing input — `.rx-landing-input`
Container:
```
flex items-center gap-3 rounded-3xl border-2 bg-surface px-5 py-4 sm:px-6 sm:py-5 shadow-soft-lg transition-colors duration-300
  idle:      border-hairline
  dragover:  border-ink/50 bg-tint
```
Text input: `flex-1 min-w-0 bg-transparent font-sans text-base sm:text-lg py-1 focus:outline-none`, placeholder **"Paste a URL"**.
Attached file: replaces the text input with a 40px thumbnail (`rounded-lg`) or a `bg-tint` tile with `FileText`, then the filename (`text-sm sm:text-base truncate`), then a ✕ button.
Validation hint (typed text that isn't a URL): `mt-2 ml-2 text-xs text-muted` — "That doesn't look like a full URL yet — try starting with http:// or https://."
Send is disabled (opacity 30%) until a valid URL or file is present. Enter submits. Accepts drag-and-drop of image/* and PDF; other types are silently ignored.

### Landing note
`mt-10 text-sm text-ink/50 font-sans max-w-2xl`

---

## App chrome

### Sticky header — `.rx-header`
```
header: sticky top-0 z-20 bg-surface/85 backdrop-blur-md shadow-soft
row:    w-full px-6 py-4 flex items-center justify-between
left:   Logo text-lg (link to /)
right:  flex items-center gap-4 → [text-right: title text-sm font-medium / status text-xs text-muted] + header theme toggle
```
The status line ("Gathering input", "Needs a decision", "Confirming the flow",
"A couple of questions", "Running the analysis", "Report") cross-fades with a
6px slide (200ms) when it changes.

---

## Conversation

### AI message (ChatBubble) — `.rx-msg`
```html
<div class="flex items-start gap-3 max-w-[52.5rem] min-w-0">  <!-- fadeInUp on mount -->
  <img class="h-8 w-8 rounded-full …" src="/avatar-icon.png">
  <div class="flex-1 min-w-0 text-base leading-relaxed font-sans break-words">…</div>
</div>
```
No bubble, no background: just avatar plus text. Text appears instantly, with no typing effect.

### User message (UserBubble) — `.rx-user-bubble`
```html
<div class="flex justify-end min-w-0">
  <div class="max-w-[45rem] min-w-0 rounded-2xl rounded-tr-md bg-ink text-surface px-5 py-3 text-base leading-relaxed font-sans break-words">…</div>
</div>
```

### Answered-questions card (user side) — `.rx-answer-card`
```
wrapper: flex justify-end min-w-0
card:    max-w-[45rem] w-full min-w-0 rounded-3xl border border-hairline bg-tint px-5 py-4 font-sans text-base leading-relaxed space-y-4
pair:    <div> per question/answer (space-y-4 = 16px is BETWEEN pairs; q and a sit directly on top of each other)
q:       <p class="text-ink/60">  → "> {question}"
a:       <p class="text-ink">     → "{answer}" or "(skipped)"
```

### Status line (loading) — `.rx-msg__status`
Inside an AI message: `flex items-center gap-2 text-ink/80` → `<CyclingLoadingLine/>` + `<ThinkingDots/>`.
Done: `flex items-center gap-2 text-ink/70` → `Check` (16px) + "Analysis complete." (spring pop-in).

### Thinking dots — `.rx-dots`
`inline-flex gap-1`. Three `h-1.5 w-1.5 rounded-full bg-ink/40` dots, y `[0,−4,0]`, 0.7s, delays 0 / .15 / .3s, easeInOut, infinite.

### Input preview (under the first AI turn) — `.rx-preview`
```
wrapper: ml-11 mt-4 max-w-xs              (scale .96→1, 350ms, delay 100ms)
image:   w-full h-56 overflow-hidden rounded-2xl border border-hairline shadow-soft → img object-cover object-top
caption: ml-11 mt-3 max-w-lg text-sm leading-relaxed text-ink/80 font-sans   (y 6→0, delay 150ms)
```
Clicking opens the lightbox.

### Suggested questions (after the report) — `.rx-suggestion`
Inside an AI message "Ask me anything about this report.":
```
list: mt-3 flex flex-col items-start gap-2
item: text-left text-ink/70 underline decoration-hairline underline-offset-4 transition-colors duration-300 hover:text-ink hover:decoration-ink/40
```
They show only until the first question is asked.

### Question card (blocked stage) — `.rx-question-card`
`w-full rounded-2xl border border-hairline bg-tint px-4 py-3` → label `block text-xs uppercase tracking-wide text-muted mb-1 font-sans` + text `font-sans text-sm text-ink`.

---

## Composer — `.rx-composer`

```
outer:  fixed bottom-6 inset-x-0 z-30 flex justify-center px-6
shell:  w-full max-w-[44.1rem] rounded-3xl border border-hairline/60 bg-surface/50 backdrop-blur-xl shadow-soft px-4 py-4
chips:  flex flex-wrap gap-2 mb-3                       (optional slot above the field)
field:  flex items-end gap-2 rounded-3xl border p-2 transition-colors duration-300
          enabled:  border-hairline bg-tint focus-within:border-ink/40
          disabled: border-hairline bg-tint/50
textarea: flex-1 min-w-0 resize-none bg-transparent font-sans text-sm focus:outline-none overflow-y-auto px-3 py-2.5
          disabled:cursor-not-allowed disabled:placeholder:text-muted/70     rows=1, auto-grows to max 200px
then:   [mic 40] [send 40]
```
Behaviour: Enter sends and Shift+Enter adds a new line. The composer **always stays
mounted**; when no stage owns it, it is disabled and the placeholder says why.
It is hidden only during the initial draft/input stage.

### Answer chips (in the composer's chips slot)
- Suggestion: `rounded-full border border-hairline bg-surface px-3.5 py-1.5 text-sm font-sans text-ink/70 transition-colors duration-300 hover:border-ink/40 hover:bg-tint`
- Skip: `rounded-full border border-hairline px-3.5 py-1.5 text-sm font-sans text-muted transition-colors duration-300 hover:border-ink/40 hover:text-ink`
- Both: hover y −2, tap scale **0.95**. Clicking a chip submits it as the answer straight away.

### Goal option cards — `.rx-goals`
```
question: font-sans text-sm font-medium text-ink mb-3
grid:     grid w-full grid-cols-1 sm:grid-cols-2 gap-2.5          (stagger .05, each fadeInUp)
card:     text-left rounded-2xl border border-hairline bg-surface p-4 transition-colors duration-300 hover:border-ink/40 hover:bg-tint   (hover y −2, tap .97)
  title:  font-sans font-medium text-sm text-ink
  desc:   font-sans text-xs text-ink/60 leading-snug mt-1
footnote: font-sans text-xs text-muted mt-2.5 → "Or type your own goal in the box below."
```

---

## Forms (input and flow stages)

| Element | Classes |
|---|---|
| Label | `block font-sans text-sm mb-2` |
| Field | `w-full rounded-2xl border border-hairline px-4 py-3 font-sans text-sm transition-all duration-300 focus:outline-none focus:border-ink focus:ring-4 focus:ring-ink/5` |
| Field error | add `border-red-500 focus:border-red-500`; message `mt-2 text-xs text-red-500 font-sans` |
| Hint | `mt-2 text-xs text-muted font-sans` |
| Dropzone | `flex items-center gap-3 cursor-pointer rounded-2xl border border-dashed border-hairline px-5 py-4 text-sm font-sans text-ink/70 transition-colors duration-300 hover:border-ink/40 hover:bg-tint` + `Upload` 16/1.5 · "Choose a file…" |

### Mode pills (sliding selection)
```
row:     ml-11 flex gap-2 mb-6 flex-wrap
pill:    relative overflow-hidden rounded-full font-sans text-sm px-4 py-2 border transition-colors duration-300
  active:   border-ink text-surface + <motion.span layoutId="mode-pill-bg" class="absolute inset-0 bg-ink shadow-soft"> (spring 400/32)
  inactive: border-hairline text-ink/70 hover:border-ink/40 hover:bg-tint
tag:     ml-2 text-[10px] uppercase tracking-wide opacity-60 → "recommended"
```

### Flow-step list
```
list: ml-11 rounded-2xl border border-hairline shadow-soft overflow-hidden
row:  flex items-center gap-3 border-b border-hairline last:border-b-0 px-4 py-2.5 odd:bg-surface even:bg-tint   (editable: py-3)
      [thumb w-10 h-10 rounded-lg border border-hairline object-cover] [GripVertical muted] [index text-sm text-muted w-5]
      [label flex-1 text-sm; editable: bg-transparent focus:underline] [badge] [↑ ↓ 🗑 text-muted hover:text-ink]
badge: text-[10px] uppercase tracking-wide text-muted border border-hairline rounded-full px-2.5 py-0.5
```

### Page picker (checkbox list)
```
box:      w-full rounded-2xl border border-hairline bg-surface overflow-hidden
head row: flex w-full items-center justify-between gap-3 border-b border-hairline px-4 py-3 hover:bg-tint
row:      flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-tint      (list max-h-72 scroll, stagger .03)
checkbox: flex h-5 w-5 items-center justify-center rounded-md border  — on: bg-ink border-ink + Check 14/2.5 text-surface
labels:   text-sm text-ink truncate / text-xs text-ink/50 truncate
footer:   border-t border-hairline p-3 → full-width pill: rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-surface
```

---

## Side rails (report view, ≥1280px)

### Chapters nav — `.rx-chapters`
```
card:   w-56 rounded-3xl border border-hairline bg-surface shadow-soft-lg p-4      (slides in from x −12)
title:  block text-xs uppercase tracking-wide text-muted font-sans px-3 mb-2 → "Chapters"
list:   space-y-0.5
item:   relative z-10 block w-full text-left rounded-xl px-3 py-2 text-sm font-sans transition-colors duration-200
          active:   text-ink font-medium + layoutId pill "absolute inset-0 rounded-xl bg-tint" (spring 420/34)
          inactive: text-ink/60 hover:text-ink
```
Clicking smooth-scrolls to the section. The active item follows scroll position
through an IntersectionObserver scroll-spy (`rootMargin: "-96px 0px -70% 0px"`,
topmost intersecting section wins).

### Promo card ("Get full audit") — `.rx-promo`
```
card:   audit-card-gradient w-72 rounded-3xl text-white px-6 py-7 text-center flex flex-col items-center overflow-hidden relative  (from x 12; hover y −3)
avatar: h-12 w-12 mb-4 shadow-soft-lg
title:  font-display text-xl leading-snug mb-2 → "Get full audit"
body:   font-sans text-xs text-white/60 mb-6
button: white pill "Talk to an expert"
```

---

## Overlays

### Image lightbox
```
backdrop: fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-8   (click to close)
content:  max-w-4xl w-full max-h-full overflow-auto           (scale .96→1, 200ms)
close:    fixed top-6 right-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white   (X 20px)
```
Thumbnails that open it use `cursor-zoom-in`.

### Evidence crop
`relative w-full overflow-hidden rounded-xl border border-hairline bg-tint`. The
box overlay is `absolute rounded-sm border-2 border-orange-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]`.
Caption: `mt-2 font-sans text-xs text-muted`.

---

## Report components

See [05-report.md](05-report.md). They are a separate, square, ruled family.
