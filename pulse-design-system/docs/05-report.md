# 05 · The report document ("Pulse report layout")

The report is the one surface that **is not chat**. It reads as a printed
consultancy document: square corners, ruled lines, upright bold serif
headings, a single violet accent for structure, and a purple-to-black gradient
on every table header. It follows the app theme (dark mode keeps the
hierarchy with lifted colors). The PDF export is always light.

Plain-CSS classes are in [../styles/components.css](../styles/components.css)
under "Report document"; React components in [../react/report.tsx](../react/report.tsx).

> **As shipped:** the callouts' 3px left rule, the "Medium" chip outline and the
> unlock-card tile borders are written as violet / secondary grey / white 15%
> below, but render as the hairline grey in the live app (02-foundations §1.8).

---

## 1. The frame

```
section: border border-rule bg-surface px-6 py-8 sm:px-12 sm:py-12      (no radius, no shadow; rises 20px, 400ms)
header:  mb-10 flex flex-wrap items-end justify-between gap-4
  left:  Eyebrow "PULSE · {AUDIT TYPE}" (mb-3) + h1 {subject, e.g. reloadux.com}
         h1: font-report-display text-4xl sm:text-5xl leading-[1.02] text-ink break-words
  right: Report CTA button  [⤓ Download PDF]
sections: each <section id="chapter-…" class="mb-8 scroll-mt-24">
```
Width: the thread column (840px), against the reference A4 page's 794px, so
proportions carry over without rescaling.

## 2. Section order (screen, PDF and chapters nav all share it)

| # | Section | Heading style |
|---|---|---|
| — | Report header (eyebrow + subject) | h1 |
| 1 | The Summary (2–3 paragraphs, **bold** emphasis allowed) | Section (violet) |
| 2 | Confidence Signal | Signal callout |
| 3 | About {business}: intro + Dimension / What we found table | Section (violet) |
| 4 | Overall Experience: intro + score grid | Topic (ink) |
| 5 | Findings Inventory: stat row (High/Medium/Low) + table (max 8 rows) + "Showing 8 of N…" caption | Topic |
| 6 | Detailed Findings: intro + finding rows | Topic |
| 7 | What's Working: ruled list | Topic |
| 8 | Not Tested: finding rows (italic note) | Topic |
| 9 | SEO & GEO Checks: stat row + checks table + "Content Quality" / "AI SEO" h3 sub-tables | Topic |
| 10 | What this scan covers, and doesn't | Scope callout |
| 11 | Suggested Fixes: table ranked by impact, then effort | Topic |
| 12 | Biggest Opportunities *(gated)*: accordion rows | Topic |
| 13 | Business Impact Summary *(gated)* | Topic |
| 14 | Additional Pages Reviewed | tertiary Eyebrow + Topic |
| 15 | Unlock the In-Depth Audit (gradient card) + case-studies strip | — |
| 16 | CTA: "Your report is ready to download" + Download PDF | — |

A section renders only when it has content. **Section headings** (violet,
`.h-sec`) open the "about you" part of the report; **topic headings** (ink,
`.h-black`) open the analysis.

## 3. Primitives

### Headings and text
```
SectionHeading  font-report-display text-[34px] leading-[1.1]  text-accent   (mb-3)
TopicHeading    font-report-display text-[34px] leading-[1.08] text-ink      (mb-1.5 when an intro follows, else mb-4)
Sub-heading h3  font-report-display text-2xl text-ink mb-3
Eyebrow         block font-sans font-bold text-[11px] uppercase tracking-[0.16em] text-accent
Body            font-sans text-sm leading-[1.65] text-secondary            (<strong> → font-bold text-ink)
Caption         font-sans text-[11px] text-tertiary mt-3
```

### Chips: severity and effort, monochrome
```
base   inline-block font-sans font-bold text-[9.5px] uppercase tracking-[0.08em] px-2.5 py-1 rounded-full whitespace-nowrap align-middle
high   bg-ink text-surface                                  → "HIGH" (Critical/High)
medium bg-transparent text-ink border border-secondary      → "MED" in tables / "MEDIUM" in finding rows
low    bg-fill text-secondary border border-rule             → "LOW" (Low/Suggestion)
soft   bg-accent-soft text-accent                           → "INFERRED" (a value inferred, not observed)
```
Finding rows show the real level name ("Critical", "Suggestion") because the
78px gutter has room for it; tables use High/Med/Low.

### Gradient table
```
wrapper  overflow-x-auto
table    w-full border-collapse
thead    .report-table-head  → linear-gradient(90deg, accent 0%, #4a3a8f 28%, #1a1430 58%, #000 100%)
th       text-left font-sans font-bold text-[10px] uppercase tracking-[0.1em] text-white px-4 py-3
td       px-4 py-3.5 border-b border-rule align-top font-sans text-[13px] leading-[1.5] text-secondary
td.key   font-bold text-ink
index    tabular-nums, zero-padded "01"
```
Column specs (header text and width):
- About: Dimension 32% · What we found
- Inventory: # 34px · Check 26% · Finding · Impact 64px (chip)
- SEO: Check 26% · Status 16% · Details (status word in `text-pass/warn/fail` bold 12px: Pass / Warning / Fail)
- Fixes: # 44px · Suggested fix 30% · What it addresses · Effort 70px (chip)

### Stat row
```
row    flex border-y border-rule
cell   flex-1 px-2 pt-5 pb-4 ; cells after the first: border-l border-rule
value  font-report-display text-[46px] leading-none tabular-nums  (FIRST cell text-accent, the rest text-ink)
label  font-sans text-[11.5px] text-secondary mt-2
```

### Score grid (Overall Experience)
```
grid   grid gap-px bg-rule border border-rule ; columns: 1.4fr repeat(5, minmax(0,1fr))
cell   flex flex-col px-4 py-5 ; lead: bg-fill, others: bg-surface
value  font-report-display leading-none whitespace-nowrap tabular-nums text-ink ; lead text-[40px], others text-2xl
unit   "/10" text-tertiary ; lead text-[15px], others text-xs
label  font-sans text-[10px] uppercase tracking-[0.06em] text-tertiary mt-auto pt-3.5
```
Lens labels: Overall Experience · Conversion · Accessibility · Trust · Content
Quality · Mobile Experience. A pending score shows an en dash (–) in tertiary.
The rationale shows as a native tooltip (`title`). The 1px gap over a rule
background is how the hairlines are drawn, so borders never double up.

### Callouts
```
Signal (Confidence)  bg-accent-faint border-l-[3px] border-accent px-6 py-5
Scope                bg-fill        border-l-[3px] border-accent px-6 py-5
  label  Eyebrow with mb-2.5 tracking-[0.12em]
  text   font-sans text-[13px] leading-[1.6] text-secondary  (bold lead words in ink: "Solid …", "Thin …", "Covers:", "Doesn't cover:")
```

### Finding row
```
li     grid grid-cols-[78px_1fr] gap-[18px] py-5 border-b border-rule      (reveals on scroll: y 8→0, 300ms, once)
left   Chip
right  h3   font-sans font-bold text-[15px] text-ink mb-1.5        → short 3–5 word title
       p    text-[12.5px] leading-[1.55] text-secondary mb-1       → what is on the page
       p    text-[12.5px] leading-[1.55] text-ink mb-1             → why it costs you
       p    text-[12.5px] leading-[1.55] text-ink mt-1.5           → <b>Fix → </b> recommendation
       ref  font-sans text-[10px] text-tertiary mt-1.5             → "Nielsen #1: … · high confidence · high impact on users · trivial to fix"
       evidence toggle  mt-2.5 flex items-center gap-1 text-[11px] font-medium text-secondary hover:text-ink + ChevronDown (rotates)
Not tested: replaces why/fix with italic tertiary "Not tested: no live URL provided."
```
This is a ruled row, not a card, so a long list reads as one continuous document.

### Other rows
- What's Working: `font-sans text-[13px] leading-[1.6] text-secondary py-3 border-b border-rule`
- Impact / opportunity rows: `border-b border-rule py-4`; area `text-sm font-bold text-ink mb-1.5`; body 12.5px with bold lead-ins ("What the audit found:", "Business impact:"). Opportunities are accordions: number `font-bold text-tertiary tabular-nums`, title `font-bold text-[15px] text-ink`, chevron tertiary; body indented `ml-8`.
- Additional page: `flex items-center gap-4 border border-rule px-5 py-4` with label `text-sm font-bold text-ink truncate` and URL `text-xs text-tertiary hover:text-ink`.
- AI-SEO raw details: `<details class="mt-4 border border-rule bg-fill px-5 py-3">`, code blocks `bg-surface border border-rule px-3 py-2 text-xs font-mono`.

### Unlock card (inside the report)
```
audit-card-gradient text-white px-6 py-8 sm:px-10 sm:py-10 mb-8 overflow-hidden relative   (square; reveals on scroll)
title  font-report-display text-[34px] leading-[1.1] mb-2 → "Unlock the In-Depth Audit"
text   font-sans text-sm text-white/60 mb-6 max-w-lg leading-[1.6]
grid   grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7
tile   border border-white/15 bg-white/5 px-5 py-4 ; label text-sm font-bold ; count font-report-display text-xl ; desc text-xs text-white/60 leading-relaxed
cta    white pill, font-bold px-7 py-3.5 → "Talk to an expert"
```

### Case studies strip
Uses the conversation's rounded language inside the document (16px cards):
heading `font-display text-xl` "How we solve this for other businesses"; subtitle
`text-sm text-ink/60 mt-1 max-w-xl`; 36px round prev/next buttons; snap-scrolling
row of `w-72 rounded-2xl border border-hairline` cards with a 16:10 image, client
(`font-medium`), problem (`text-ink/70`), outcome (`font-medium`), italic quote
(`text-xs text-muted`); "View all case studies →" link.

### Final CTA
`mt-10 pt-8 border-t border-rule flex flex-col items-center gap-4 text-center` →
`text-sm text-secondary` "Your report is ready to download" + Report CTA `px-7 py-3.5`.

---

## 4. Writing rules for report content

- **Summary**: three short paragraphs for a non-technical reader. Lead with the
  biggest cost in business terms, then the patterns, then where to start. Bold a
  few words at most.
- **Finding title**: 3–5 words naming the subject ("Heading structure", "Form status").
- **Finding body, in three beats**: observation (secondary grey), why it costs
  (ink), **Fix →** (ink). A finding that only observes is an assertion; all three
  make it arguable.
- **Confidence Signal**: say what is **Solid** (read directly off the page) and
  what is **Thin** (behind an interaction, inferred).
- **Never invent numbers**: a pending score shows "–".

## 5. PDF (always light)

A4, 794×1123. Same order. Fonts are the TTFs in `assets/fonts/ttf`
(registered with react-pdf). Ink in the PDF is pure `#000000`; greys are
`G50 #F5F5F5`, `G100 #D9D9D9`, `G300 #C3C3C3`, `G400 #A5A9AC`, `G500 #565656`. Running header on content pages: the logo at 13pt,
a 1px `#C3C3C3` bar, an 8pt `#A5A9AC` label. Page number bottom-right at 8.5pt.

| Style | Spec |
|---|---|
| Cover title | Serif 700, 44pt, lh 1.05, then a 1px ink rule |
| Section heading | Serif 700, 24pt, lh 1.15, violet `#7F56D9` |
| Topic heading | Serif 700, 26pt, lh 1.12, ink |
| h3 | Serif 700, 15pt |
| Body | Sans 10pt, lh 1.6, `#565656` |
| Table cell | Sans 9pt, lh 1.45, padding 9×10 |
| Chips | Sans 700, 6.5pt; high black, med outlined, low `#F5F5F5`, soft `#E8DFFA` |
| Stat numeral | Serif 700, 30pt (first violet) |
| Score lead / lens | Serif 700, 26 / 16pt; lead cell `#FAFAFA` |
| Signal callout fill | `#F3EFFC` (violet 8% over white) |
| Back cover | Black page, violet radial blobs, serif 700 38pt white headline, `#D9D9D9` contact text |
