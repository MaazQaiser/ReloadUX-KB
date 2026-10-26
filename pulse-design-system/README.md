# ReloadUX · Pulse — Design System (drop-in folder)

A self-contained folder that reproduces the look, motion and conversation
style of the ReloadUX AI Audit app ("Pulse"). Copy it into another project,
import one CSS file, and use the React components, or just the CSS classes.

Every value was extracted from the shipping app and then **measured against
it**: the kit's components render with the same computed styles as the real
app (see "How this was verified").

## What's inside

```
pulse-design-system/
├── styles/
│   ├── pulse.css        ← import this one file (base + tokens + components)
│   ├── base.css         scoped reset, only applies inside .pulse
│   ├── tokens.css       --pulse-* variables, fonts, signature utilities
│   ├── components.css   .rx-* classes for every component
│   └── tailwind.css     OPTIONAL Tailwind v4 bridge (bg-pulse-ink, …)
├── react/               ready-made React components (index.ts exports all)
├── assets/              fonts (woff2 + ttf) and images (avatar, backdrops)
├── examples/
│   ├── react/PulseShowcase.tsx   a full screen built from the kit
│   └── static/index.html         the same, plain HTML + CSS
├── docs/                design language, foundations, components, chat, report, motion
└── reference/           screenshots of the real app (light/dark, desktop/mobile)
```

## Requirements

- **React 18 or 19** for the components (the CSS alone needs nothing).
- **framer-motion 11+** (`npm i framer-motion`). Tested with 12 and 14.
- **No Tailwind needed.** It works next to Tailwind v3, Tailwind v4 or no Tailwind.
- Fonts and images are inside the folder; nothing is fetched from the internet.

## Install

### 1. Copy the folder

| Your project | Put it at | Import path |
|---|---|---|
| Next.js (App Router) | project root: `./pulse-design-system` | `@/pulse-design-system/...` |
| Vite / CRA | `./src/pulse-design-system` (tsconfig only checks `src/`) | `./pulse-design-system/...` |
| Plain HTML | anywhere served by your web server | `<link href=".../styles/pulse.css">` |

### 2. Install the animation library

```bash
npm i framer-motion
```

Using the newer `motion` package instead? Either also install `framer-motion`,
or replace `"framer-motion"` with `"motion/react"` in the files under `react/`
(the API is identical).

### 3. Import the CSS once, wrap your UI in `.pulse`

**Next.js (App Router)** in `app/layout.tsx`:

```tsx
import "./globals.css";
import "@/pulse-design-system/styles/pulse.css";
import { PulseThemeScript } from "@/pulse-design-system/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <PulseThemeScript /> {/* skip this if you already use next-themes */}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

Next.js **Pages Router**: put the CSS import in `pages/_app.tsx` instead.

**Vite** in `src/main.tsx`:

```tsx
import "./pulse-design-system/styles/pulse.css";
```

Then render Pulse UI inside `<PulseRoot>`, or any element with `class="pulse"`:

```tsx
"use client";
import { useState } from "react";
import { PulseRoot, PageHeader, ThreadLayout, Message, UserBubble, ChatComposer } from "@/pulse-design-system/react";

export default function Chat() {
  const [draft, setDraft] = useState("");
  return (
    <PulseRoot page>
      <PageHeader title="Heuristic Analysis" step="A couple of questions" />
      <ThreadLayout>
        <Message>Got it, here&apos;s what I&apos;ll be working from</Message>
        <UserBubble>Looks right, confirmed.</UserBubble>
      </ThreadLayout>
      <ChatComposer value={draft} onChange={setDraft} onSubmit={() => {}} placeholder="Ask Pulse" />
    </PulseRoot>
  );
}
```

`examples/react/PulseShowcase.tsx` is a complete page (landing → conversation
→ report → Q&A) to copy from. You can render it directly to check the install:
`<PulseShowcase previewImage="/some-screenshot.jpg" />`.

**Plain HTML:** `<link rel="stylesheet" href="pulse-design-system/styles/pulse.css">`,
add `class="pulse pulse-page"` to `<body>`, and use the `.rx-*` markup from
`examples/static/index.html`. Serve it over http rather than opening the file
directly, because browsers can block fonts over `file://`.

## Components (`react/`)

| Group | Components |
|---|---|
| Brand & theme | `PulseRoot`, `Logo`, `Avatar`, `ThemeToggle`, `PulseThemeScript`, `usePulseTheme` |
| Landing | `LandingPage` (whole screen), `LandingInput` |
| Chrome | `PageHeader`, `ThreadLayout` (with optional side rails), `ChaptersNav` (scroll-spy), `PromoCard` |
| Conversation | `Message`, `UserBubble`, `AnsweredCard`, `StatusMessage`, `DoneMessage`, `ThinkingDots`, `CyclingWord`, `CyclingLoadingLine`, `Suggestions`, `InputPreview`, `QuestionCard`, `RUNNING_PHRASES`, `AUDIT_LOADING_PHRASES` |
| Composer | `ChatComposer` (voice input included), `AnswerChip`, `SkipChip`, `GoalOptionCards` |
| Buttons & forms | `Button` (primary/secondary/report/white), `LinkButton`, `IconButton`, `Field`, `TextArea`, `Label`, `FieldError`, `FieldHint`, `Dropzone`, `ModePills`, `FlowStepList` |
| Report | `ReportDocument`, `Section`, `SectionHeading`, `TopicHeading`, `SubHeading`, `Eyebrow`, `Body`, `Caption`, `Chip`, `SoftChip`, `GradientTable`, `Td`, `StatRow`, `ScoreGrid`, `SignalCallout`, `ScopeCallout`, `FindingRow`, `FindingList`, `RuledList`, `UnlockCard`, `CaseStudies`, `ReportCTA` |
| Other | `ImageLightbox`, `icons`, the motion presets (`fadeInUp`, `pressable`, `springs`, …), `cx` |

## Theming

- **Dark mode** follows a `dark` class on `<html>`, the same convention as
  next-themes (`attribute="class"`). `PulseThemeScript` applies the saved or
  system theme before first paint, and `ThemeToggle` flips it. If you use
  next-themes, pass `isDark`/`onToggle` to `ThemeToggle` from its `useTheme()`.
- **Borders, as shipped vs as written.** In the live app every border renders
  as the light hairline grey, even where the code asks for ink, violet or red
  (a global CSS rule overrides them; see docs/02-foundations §1.8). The kit
  matches the live app. For the borders as originally designed, add
  `data-pulse-borders="intended"` to `<html>`.

## Won't clash with your project

- Every CSS variable is `--pulse-*` and every class is `.rx-*`, so nothing
  collides with shadcn or your own `--muted` / `--accent` / `--secondary`.
- Nothing styles `html`, `body` or bare elements outside `.pulse`.
- Inside `.pulse`, host rules such as `h1 { letter-spacing }`, `p { margin }`,
  `button { background }`, a different root font size or centered text are
  neutralized, so the kit looks the same in any host.
- All sizes are in px (the app's rem values at 16px), so a host root font size
  can't stretch the layout.

## How this was verified

The folder was copied into two fresh projects that match your stacks, each
with deliberately conflicting global styles added:

| Test | Result |
|---|---|
| Next.js 16.4.2 + React 19.3 + Tailwind v4 (like Auto site / ReloadUX KB / Renovus) | type-check ✓, production build ✓, ESLint 0 errors ✓, no console errors ✓ |
| Vite 8 + React 18.3 + TypeScript 6 + framer-motion 14, no Tailwind (like Gensis Health) | type-check ✓, build ✓, no console errors ✓ |
| Plain HTML (`examples/static`) | renders, fonts and images load ✓ |
| Computed styles vs the real app, thread + report (light and dark) | 1,906 / 1,960 properties identical; the other 54 render the same (e.g. `9999px` vs Tailwind's `calc(infinity)` radius, `rgba` vs `lab` for the same white) |
| Computed styles vs the real app, landing page (light and dark) | 486 / 504 identical; the other 18 are the same radius and shadow notation differences |
| Hostile host CSS (`--muted`, `--accent`, `button {…}`, `h2 {…}`, `p {…}`, 18px root font) | no effect inside `.pulse` ✓ |

## Known limits

- Next.js's ESLint shows 5 **warnings** suggesting `next/image` instead of
  `<img>`. They're harmless, and the kit keeps `<img>` so it works outside Next.
- Fonts are the Latin subset only, the same as the app.
- The ready-made components cover the visual layer. The app's audit logic (API
  calls, stages, scoring) isn't included; wire your own data into the props.
- `ModePills` and `ChaptersNav` use shared-layout animations. If you render two
  of the same on one page, give each a different `id`.

## Docs

| File | What it covers |
|---|---|
| [docs/01-design-language.md](docs/01-design-language.md) | **Start here.** The aesthetic, the principles, the signature details, voice, do/don't |
| [docs/02-foundations.md](docs/02-foundations.md) | Color, typography, layout, shape, elevation, icons, assets, the border note |
| [docs/03-components.md](docs/03-components.md) | Every component's original Tailwind classes, states and motion |
| [docs/04-chat-experience.md](docs/04-chat-experience.md) | The conversation flow step by step, composer rules, loading phrases, all wording |
| [docs/05-report.md](docs/05-report.md) | The report document: section order, tables, chips, scores, PDF |
| [docs/06-motion-reference.md](docs/06-motion-reference.md) | Every animation value per component |
| [docs/tokens.json](docs/tokens.json) | Tokens for Figma (Tokens Studio) or Style Dictionary |
| [docs/tailwind-theme.original.css](docs/tailwind-theme.original.css) | The app's own Tailwind globals, for reference |

Extracted from `reloadux-audit-agent` @ `7ca968c`.
