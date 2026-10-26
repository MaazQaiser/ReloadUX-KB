# 01 · Design language

How Pulse looks, feels and speaks, and the rules behind each choice. Read this
first. The other files hold the exact values; this one explains why they are
what they are, so you can extend the system without drifting off it.

---

## The look in one paragraph

Pulse is **editorial monochrome with one violet thread**. Pages are ink on paper
(`#090909` on white, or `#f2f2f2` on `#0e0e0e` in dark mode). A geometric
grotesk, **Manrope**, does all the work. A literary serif, **Libre Baskerville**,
appears only at moments of voice: italic for the AI's hero lines, upright bold
for report headings. Every interactive element is a **pill**. Every container is
a **soft-cornered card on a whisper of shadow**, except the final report, which
is deliberately **square, ruled and printed-looking**, because it is a
deliverable, not a chat bubble. Violet appears in three places only: the
animated "Pulse" wordmark, the dark promo gradients, and the report's structural
accent. Motion is quiet, fast and always eased out (`cubic-bezier(.22,1,.36,1)`):
things rise 12px into place, lift 2px on hover, and press to 96%.

## Mood words

| It is | It is not |
|---|---|
| Calm, confident, editorial | Loud, gamified, "AI sparkle" |
| Monochrome with intent | Grey and lifeless (contrast is high: ink is near-black) |
| Conversational (a chat, not a form) | A wizard with steps and progress bars |
| Premium agency (reloadux.com) | Generic SaaS dashboard |
| Precise, ruled, document-like (report) | Card soup |

---

## Principles

### 1. Two worlds: the conversation and the document
The product has **two visual registers**. Mixing them up is the most common way
a clone looks off.

| | Conversation (landing, thread, composer, rails) | Document (the report) |
|---|---|---|
| Corners | Rounded: 16px cards, 24px panels, pills | **Square** (0 radius), except chips and buttons |
| Separation | Soft shadow + 1px hairline | 1px **rule** lines, 1px-gap grids |
| Headings | **Italic** serif (`.font-display`), regular weight | **Upright bold** serif, tracking −0.02em |
| Body | 16px / 1.625, ink | 12.5–14px, `--secondary` grey |
| Colour | Pure monochrome | Monochrome + violet accent for structure |
| Feel | Chat app (Claude/ChatGPT-like) | Printed consultancy report |

### 2. Ink is both a text colour and a fill
`--ink` is the primary text colour **and** the solid fill for every primary
button, the user's chat bubble, the theme toggle and the send button. On those
fills, text uses `--surface`. Because both flip with the theme, a primary
button is black-on-white in light mode and white-on-black in dark mode. Never
hard-code `#000` or `#fff` on themed elements. The only fixed whites are on
the always-dark violet gradient cards.

### 3. Violet means structure, never severity
The accent `#7f56d9` (dark mode `#9b7ce8`) marks **structure** in the report:
section headings, eyebrows, the first stat numeral, callout rules, the
table-header gradient, and the "inferred" chip. Severity chips stay
**monochrome** (solid ink / outlined / grey). Never colour a finding by its
priority in violet, and never use violet as a generic "brand button" colour.
Primary buttons are ink.

### 4. Opacity, not new greys
Secondary text in the conversation is **ink at an opacity**, not a new hex:
`ink/80` (status lines), `ink/70` (chip labels, suggestions), `ink/60` (nav,
descriptions, links), `ink/50` (landing note), `ink/40` (thinking dots). This
keeps every grey on-theme in both modes automatically. `--muted`
is used for captions, placeholders and uppercase labels.

### 5. Hairlines everywhere — and they stay hairlines
Every border is `--hairline` (`#d9d9d9` / `#2c2c2e`), at rest and in every
state. Interaction is shown by **fill, not outline**: on hover a control gains a
`--tint` background; on focus a text field gains a soft 4px `ink/5` ring.

> **As shipped vs as written.** The app's code asks for darker borders on
> hover (`ink/40`), ink outlines on focus, secondary buttons and active pills,
> a violet left rule on report callouts, and so on. None of it renders: an
> unlayered `* { border-color: hairline }` in globals.css overrides every
> Tailwind border-colour class (measured in both themes). The kit reproduces
> what ships. To get the written version, add `data-pulse-borders="intended"`
> to `<html>` (see 02-foundations §1.8).

### 6. Soft ambient elevation
There are only two shadows, both from reloadux.com: `soft` (`0 4px 28px
rgba(0,0,0,.06)`) and `soft-lg` (`0 8px 40px rgba(0,0,0,.08)`). They are
large-blur, low-opacity "air", never crisp drop shadows. Elevation goes up on
hover (`soft` to `soft-lg`), and that is the only shadow animation.

### 7. Glass for chrome
Persistent chrome is translucent and blurred, so the conversation shows through:
- Header: `surface` at 85% + 12px blur + `soft` shadow.
- Composer shell: `surface` at 50% + 24px blur + hairline at 60% + `soft` shadow.

### 8. One column, one measure
Everything in the thread aligns to one **840px column** (`52.5rem`): AI turns,
user bubbles (max 720px), stage forms, the report. Attachments under an AI turn
are indented **44px** (32px avatar + 12px gap), so they align with the message
text, not the avatar. The composer (705.6px) is slightly narrower than the
column and floats 24px above the viewport bottom.

### 9. Motion that confirms, never performs
Entrances are 300–500ms, eased out, and travel at most 12–20px. Hover lifts
2px; taps press to 0.94–0.97. Loops exist only where something is genuinely
working: thinking dots, cycling status lines, the "Pulse" gradient, the promo
card drift. No typing effect on AI text, no confetti, no skeleton shimmer.

### 10. Honest states
No fake progress: loading uses rotating playful phrases plus three dots, not a
percentage. A missing score shows an en dash, never a placeholder number. A
disabled composer always explains itself in its placeholder ("Working on it…",
"Choose an option above to continue…").

---

## Signature moments (get these exactly right)

1. **Landing hero.** Italic Baskerville, *"Hello, I am* **Pulse***, I can do quick
   audit for your* **App**", where "Pulse" is a slowly sliding violet gradient
   (4s loop) and the last noun cycles Website → App → Product → SaaS every 2.4s
   with a 10px slide. Below it, a fat 24px-radius input with a 2px hairline
   border, the `soft-lg` shadow, a round paperclip on the left (only while
   empty) and a round ink arrow on the right (30% opacity until a valid URL).
2. **Landing backdrop.** Light: the iridescent glass-ring art (`reload-engine-bg-light.png`)
   covering a `#d9d9d9` page. Dark: pure `#000` page with the chrome ribbon art
   anchored bottom-right at `min(60vw, 1040px)`.
3. **The "UX" avatar** next to every AI turn: a grey disc with bold "UX" and a
   violet ring (`avatar-icon.png`). It is the AI's face; never swap in a robot icon.
4. **User bubble:** solid ink, 16px radius with a **6px top-right corner**: the
   speech tail.
5. **Floating glass composer** with a tinted inner field, round mic and round ink
   send (arrow-up). When listening, the mic stroke turns into the Pulse gradient
   and breathes.
6. **Report table headers:** violet → `#4a3a8f` (28%) → `#1a1430` (58%) → black,
   left to right, white uppercase 10px labels.
7. **Promo card ("Get full audit"):** near-black `#0a0a0f` with a 700px violet
   radial and a 700px black radial drifting in opposite directions on a 6s loop,
   white text, white pill button.

---

## Voice and tone

Pulse speaks in the **first person, as a sharp senior UX consultant who is also a
bit charming**. It is plain-spoken, specific and honest about its limits.

- **First person, present tense:** "Got it, here's what I'll be working from".
  "I went through reloadux.com but didn't find anything to work with".
- **Sentence case** for everything: buttons, headings, labels. ("Talk to an
  expert", "Download PDF", "Looks right, confirm".) Uppercase appears only in
  small tracked labels (CHAPTERS, eyebrows, table headers, chips).
- **Em dashes** for asides; the **ellipsis character "…"** (not three dots) on
  every in-progress phrase and placeholder.
- **Playful only while waiting.** Loading lines have personality ("Weighing
  severity like a tiny judge…", "Double-checking our double-checking…"). Findings
  and errors are sober.
- **Honest about limits:** "An automated capture can only see the login page, not
  the real product behind it". "Not tested: no live URL provided."
- **Findings argue in three beats:** what is on the page, why it costs you, and
  **Fix →** what to change.
- **Reassuring errors:** "Something went wrong while running the analysis — this
  can happen on a slow or unresponsive page. No progress was lost; it's safe to
  try again."

See [04-chat-experience.md](04-chat-experience.md) for the full copy deck.

---

## Do / don't

| Do | Don't |
|---|---|
| Use ink pills for primary actions | Make a violet "brand" button |
| Use the italic serif for one display line per view | Set body copy or UI labels in serif |
| Round conversational UI (16/24px, pills) | Round the report document or its tables |
| Express secondary text as `ink/NN` | Introduce a new grey hex |
| Lift 2px and tint the background on hover | Scale cards up or add glows on hover |
| Keep one 840px column | Let a stage or the report grow wider than the bubbles |
| Explain disabled states in the placeholder | Hide the composer between steps (except the draft stage) |
| Use `soft` / `soft-lg` only | Use tight or dark drop shadows |
