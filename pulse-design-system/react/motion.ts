// ReloadUX · Pulse — motion presets (framer-motion v11/v12).
//
// The shared block is the app's lib/motion.ts verbatim, so every component's
// animation feels like one system. The rest are the exact one-off values the
// app's components use, typed so they can be spread straight onto motion.*.
// Full per-component catalogue: docs/06-motion-reference.md.
// Using the `motion` package instead of framer-motion? Change the imports in
// this folder from "framer-motion" to "motion/react"; the API is the same.
import type { Transition, Variants } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, ease: EASE } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE } },
};

export function staggerContainer(staggerChildren = 0.06, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren, delayChildren } },
  };
}

// Spread onto motion.button/motion.div for a consistent press/hover feel.
export const pressable = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.96 },
  transition: { duration: 0.2, ease: EASE } as Transition,
};

export const tapOnly = {
  whileTap: { scale: 0.94 },
  transition: { duration: 0.15, ease: EASE } as Transition,
};

// ---------------------------------------------------------------------------
// Component-level values (as used in the shipping app)
// ---------------------------------------------------------------------------

export const springs = {
  /** Mode-picker sliding pill (layoutId). */
  modePill: { type: "spring", stiffness: 400, damping: 32 } as Transition,
  /** Chapters-nav sliding pill (layoutId). */
  chapterPill: { type: "spring", stiffness: 420, damping: 34 } as Transition,
  /** Flow-step rows (layout reorder). */
  flowReorder: { type: "spring", stiffness: 400, damping: 34 } as Transition,
  /** "✓ Analysis complete." pop. */
  completeTick: { type: "spring", stiffness: 400, damping: 20 } as Transition,
};

/** Cross-fade with a vertical slide: hero noun (10px), status line (6px). */
export function swapY(distance: number, duration: number) {
  return {
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -distance },
    transition: { duration, ease: "easeInOut" } as Transition,
  };
}

/** Inline panels that open/close inside the thread. */
export const collapse = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.25 } as Transition,
};

/** Accordion bodies in the report (evidence, opportunities). */
export const accordion = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.25, ease: "easeInOut" } as Transition,
};

/** Rows that reveal the first time they scroll into view. */
export function revealOnScroll(y: number, duration: number, margin: `${number}px` = "-40px") {
  return {
    initial: { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin },
    transition: { duration } as Transition,
  };
}
