# Motion reference

Every animation value used in the app, per component (framer-motion). The typed, importable presets are in [../react/motion.ts](../react/motion.ts); the components in `react/` already apply all of these.

```ts
// ReloadUX · Pulse — motion presets for framer-motion (v12, "framer-motion" package).
//
// The first block is lib/motion.ts verbatim: shared variants so every
// component's animation feels like one system. The second block collects the
// one-off values used directly in components, so a clone can reproduce each
// interaction exactly instead of approximating it.

export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, ease: EASE } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE } },
};

export function staggerContainer(staggerChildren = 0.06, delayChildren = 0) {
  return {
    hidden: {},
    show: { transition: { staggerChildren, delayChildren } },
  };
}

// Spread onto motion.button/motion.div for a consistent press/hover feel.
export const pressable = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.96 },
  transition: { duration: 0.2, ease: EASE },
};

export const tapOnly = {
  whileTap: { scale: 0.94 },
  transition: { duration: 0.15, ease: EASE },
};

// ---------------------------------------------------------------------------
// Component-level values (as used in the shipping app)
// ---------------------------------------------------------------------------

/** Landing page: header drops in, hero/input rise in sequence, note fades last. */
export const landing = {
  header: { initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } },
  hero: { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.05 } },
  input: { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.15 } },
  note: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5, delay: 0.35 } },
  /** Round send button — only when enabled. */
  send: { whileHover: { x: 2 }, whileTap: { scale: 0.94 } },
};

/** Hero noun swap ("Website" → "App" → "Product" → "SaaS"), every 2.4s. */
export const cyclingWord = {
  intervalMs: 2400,
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: "easeInOut" },
};

/** Status line under the avatar while something loads, every 2.2s (running stage: see copy doc). */
export const cyclingLoadingLine = {
  intervalMs: 2200,
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.3, ease: "easeInOut" },
};

/** Three dots, 6px, bounce −4px. */
export const thinkingDot = (i: number) => ({
  animate: { y: [0, -4, 0] },
  transition: { duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" },
});

/** Theme toggle icon swap (Sun ↔ Moon), AnimatePresence mode="wait". */
export const themeIcon = {
  initial: { opacity: 0, rotate: -90, scale: 0.6 },
  animate: { opacity: 1, rotate: 0, scale: 1 },
  exit: { opacity: 0, rotate: 90, scale: 0.6 },
  transition: { duration: 0.25 },
  button: { whileHover: { y: -2 }, whileTap: { scale: 0.92 } },
};

/** Sticky header: row drops in; the status line under the title swaps. */
export const header = {
  row: { initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } },
  step: { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.2 } },
};

/** Whole thread page fades in once the audit is loaded. */
export const threadPage = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.35 } };

/** Preview image under the first AI turn, then its caption. */
export const inputPreview = {
  image: { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.35, delay: 0.1 } },
  caption: { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: 0.15 } },
};

/** A message that appears mid-stage (loading line, follow-up). */
export const stageMessage = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

/** Inline panels that open/close inside the thread (mismatch notice, extra fields). */
export const collapse = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.25 },
};

/** Accordion bodies in the report (evidence, opportunities) + chevron rotate 0→180. */
export const accordion = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.25, ease: "easeInOut" },
  chevron: { duration: 0.2 },
};

/** "✓ Analysis complete." pops in. */
export const completeTick = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { type: "spring", stiffness: 400, damping: 20 },
};

/** Shared-element pills: mode picker (layoutId "mode-pill-bg") and chapters nav ("chapter-active-pill"). */
export const springs = {
  modePill: { type: "spring", stiffness: 400, damping: 32 },
  chapterPill: { type: "spring", stiffness: 420, damping: 34 },
  flowReorder: { type: "spring", stiffness: 400, damping: 34 }, // flow rows (layout): initial {opacity:0,y:-8}, exit {opacity:0,x:-20}
};

/** Side rails slide in from their own side once the report exists. */
export const rails = {
  chapters: { initial: { opacity: 0, x: -12 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.35 } },
  promo: { initial: { opacity: 0, x: 12 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.35 }, whileHover: { y: -3 } },
  promoButton: { whileHover: { scale: 1.04 }, whileTap: { scale: 0.96 } },
};

/** Report: document rises in; rows/cards reveal on scroll, once. */
export const report = {
  document: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } },
  scoreGrid: { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } },
  findingRow: {
    initial: { opacity: 0, y: 8 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.3 },
  },
  /** What's Working rows. (Impact rows, opportunity rows and Additional Pages use plain fadeInUp on mount.) */
  listRow: {
    initial: { opacity: 0, y: 6 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.25 },
  },
  /** Case studies strip: staggerContainer(0.06) revealed whileInView (once, margin -40px); cards use fadeInUp. */
  caseStrip: { stagger: 0.06, viewport: { once: true, margin: "-40px" } },
  unlockCard: {
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.4 },
  },
  ctaButton: { whileHover: { scale: 1.04 }, whileTap: { scale: 0.96 } },
  unlockButton: { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } },
  caseCard: { whileHover: { y: -4 }, transition: { duration: 0.2 } },
  caseNav: { whileHover: { scale: 1.08 }, whileTap: { scale: 0.9 } },
};

/** Goal cards in the composer: stagger 0.05, each fadeInUp; hover y −2, tap .97. */
export const goalCards = { stagger: 0.05, whileHover: { y: -2 }, whileTap: { scale: 0.97 } };

/** Mic while listening: pulse. */
export const micListening = {
  animate: { scale: [1, 1.15, 1] },
  transition: { duration: 1.1, repeat: Infinity, ease: "easeInOut" },
};

/** Image lightbox. */
export const lightbox = {
  backdrop: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  content: { initial: { scale: 0.96, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.96, opacity: 0 }, transition: { duration: 0.2 } },
};
```
