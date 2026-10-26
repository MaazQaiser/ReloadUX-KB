"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar } from "./brand";
import { Check } from "./icons";
import { cx } from "./cx";
import { fadeInUp, springs, swapY } from "./motion";

/**
 * One AI turn: the "UX" avatar + plain text. No bubble shell, no typing
 * effect — it fades up 12px on mount.
 */
export function Message({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="show" className={cx("rx-msg", className)}>
      <Avatar />
      <div className="rx-msg__body">{children}</div>
    </motion.div>
  );
}

/** The user's turn: right-aligned solid ink bubble with a sharp top-right tail. */
export function UserBubble({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="show" className={cx("rx-user-row", className)}>
      <div className="rx-user-bubble">{children}</div>
    </motion.div>
  );
}

/** Recap of answered intake questions, on the user's side ("> question" / answer). */
export function AnsweredCard({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="show" className="rx-user-row">
      <div className="rx-answer-card">
        {items.map((item, i) => (
          <div key={i}>
            <p className="rx-answer-card__q">&gt; {item.question}</p>
            <p className="rx-answer-card__a">{item.answer}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/** Three 6px dots bouncing −4px — the "still working" indicator. */
export function ThinkingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--pulse-ink-40)", display: "block" }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

/**
 * One word at a time, swapped on an interval. The longest word sits invisibly
 * in the same grid cell so the line never reflows. (Landing hero noun.)
 */
export function CyclingWord({ words, intervalMs = 2400, className }: { words: string[]; intervalMs?: number; className?: string }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (words.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % words.length), intervalMs);
    return () => clearInterval(t);
  }, [words.length, intervalMs]);
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "");
  return (
    <span className="rx-cycling">
      <span aria-hidden className="rx-cycling__sizer">{longest}</span>
      <AnimatePresence mode="wait">
        <motion.span key={words[index]} {...swapY(10, 0.35)} className={className}>
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export const AUDIT_LOADING_PHRASES = [
  "Reading the page…",
  "Fetching details…",
  "Capturing every UX point…",
  "Looking at colors and typography…",
  "Mapping the layout…",
  "Checking accessibility signals…",
];

export const RUNNING_PHRASES = [
  "Give me a moment, putting this audit together.",
  "Squinting at your button hierarchy…",
  "Counting how many clicks to checkout…",
  "Interrogating your color contrast…",
  "Reading between the pixels…",
  "Weighing severity like a tiny judge…",
  "Sniffing out missing alt text…",
  "Untangling your navigation…",
  "Measuring whitespace with a ruler…",
  "Cross-examining your calls-to-action…",
  "Tracing every dead-end click…",
  "Politely judging your form labels…",
  "Peeking under the hood of your DOM…",
  "Making sure nothing's hiding in the footer…",
  "Double-checking our double-checking…",
];

/** Cycles short status phrases while something slow is in flight. */
export function CyclingLoadingLine({ phrases = AUDIT_LOADING_PHRASES, intervalMs = 2200 }: { phrases?: string[]; intervalMs?: number }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (phrases.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % phrases.length), intervalMs);
    return () => clearInterval(t);
  }, [phrases.length, intervalMs]);
  return (
    <AnimatePresence mode="wait">
      <motion.span key={phrases[index]} {...swapY(6, 0.3)}>
        {phrases[index]}
      </motion.span>
    </AnimatePresence>
  );
}

/**
 * An AI turn that says "I'm working": cycling phrase + dots. Use
 * RUNNING_PHRASES at 2400ms while an analysis runs (as the app does).
 */
export function StatusMessage({ phrases, intervalMs }: { phrases?: string[]; intervalMs?: number }) {
  return (
    <Message>
      <span className="rx-msg__status">
        <CyclingLoadingLine phrases={phrases} intervalMs={intervalMs} />
        <ThinkingDots />
      </span>
    </Message>
  );
}

/** "✓ Analysis complete." — springs in. */
export function DoneMessage({ children = "Analysis complete." }: { children?: ReactNode }) {
  return (
    <Message>
      <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={springs.completeTick} className="rx-msg__done">
        <Check /> {children}
      </motion.span>
    </Message>
  );
}

/** Underlined follow-up questions, one per line, inside an AI turn. */
export function Suggestions({ items, onPick, disabled }: { items: string[]; onPick: (q: string) => void; disabled?: boolean }) {
  return (
    <div className="rx-suggestions">
      {items.map((q) => (
        <button key={q} type="button" className="rx-suggestion" disabled={disabled} onClick={() => onPick(q)}>
          {q}
        </button>
      ))}
    </div>
  );
}

/**
 * The screenshot + one-paragraph read shown under the first AI turn,
 * indented 44px to line up with the message text.
 */
export function InputPreview({ src, alt, caption, onOpen }: { src: string; alt: string; caption?: ReactNode; onOpen?: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="rx-preview"
      >
        <button type="button" onClick={onOpen} style={{ display: "block", width: "100%", textAlign: "left", cursor: onOpen ? "zoom-in" : "default" }}>
          <div className="rx-preview__frame">
            <img src={src} alt={alt} />
          </div>
        </button>
      </motion.div>
      {caption && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="rx-preview__caption"
        >
          {caption}
        </motion.p>
      )}
    </>
  );
}

/** A question restated inside the thread (blocked stage): small caps label + text. */
export function QuestionCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rx-question-card">
      <span className="rx-question-card__label">{label}</span>
      <span className="rx-question-card__text">{children}</span>
    </div>
  );
}
