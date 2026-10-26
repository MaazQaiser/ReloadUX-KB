"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Mic } from "./icons";
import { cx } from "./cx";
import { fadeInUp, staggerContainer } from "./motion";

// Max height (px) before the textarea stops growing and scrolls internally.
const MAX_HEIGHT = 200;

// Minimal Web Speech API shape (not in TypeScript's DOM lib; Chrome/Edge/Safari only).
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

// Browser support never changes at runtime; false on the server so markup matches.
const noSubscribe = () => () => {};
const useVoiceSupported = () =>
  useSyncExternalStore(noSubscribe, () => !!getSpeechRecognitionCtor(), () => false);

export interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  /** Disabled: tinted field at 50%, and the placeholder should say why ("Working on it…"). */
  disabled?: boolean;
  /** Optional row above the field: AnswerChip/SkipChip, or GoalOptionCards. */
  chips?: ReactNode;
  /** Show the mic where the browser supports speech recognition (default true). */
  voice?: boolean;
  /** Pin to the viewport bottom like the app (default). `false` renders it in flow. */
  fixed?: boolean;
}

/**
 * The floating glass composer: Enter sends, Shift+Enter is a new line, the
 * textarea grows to 200px. Keep it mounted for the whole conversation and
 * switch it to `disabled` with an explanatory placeholder between steps.
 */
export function ChatComposer({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  chips,
  voice = true,
  fixed = true,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const voiceSupported = useVoiceSupported();

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  useEffect(() => {
    if (disabled) recognitionRef.current?.stop();
  }, [disabled]);
  useEffect(() => () => recognitionRef.current?.stop(), []);

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    let finalText = "";
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      onChange(`${finalText}${interim}`.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  return (
    <div
      data-chat-composer
      className="rx-composer"
      style={fixed ? undefined : { position: "relative", bottom: "auto", left: "auto", right: "auto", padding: 0 }}
    >
      {/* The listening mic's stroke uses the Pulse gradient. */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <linearGradient id="pulse-mic-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="25%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#c4b5fd" />
            <stop offset="75%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
      </svg>
      <div className="rx-composer__shell">
        {chips && <div className="rx-composer__chips">{chips}</div>}
        <div className={cx("rx-composer__field", disabled && "is-disabled")}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!disabled) onSubmit();
              }
            }}
            rows={1}
            disabled={disabled}
            placeholder={placeholder}
          />
          {voice && voiceSupported && (
            <button
              type="button"
              onClick={toggleListening}
              disabled={disabled}
              aria-label={listening ? "Stop voice input" : "Start voice input"}
              aria-pressed={listening}
              className="rx-icon-btn rx-icon-btn--outline"
            >
              <motion.span
                animate={listening ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={listening ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : undefined}
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Mic stroke={listening ? "url(#pulse-mic-gradient)" : "currentColor"} />
              </motion.span>
            </button>
          )}
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
            aria-label="Send"
            className="rx-icon-btn rx-icon-btn--send"
          >
            <ArrowUp />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Suggestion chip for the composer's chips row — clicking submits it as the answer. */
export function AnswerChip({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} onClick={onClick} className="rx-chip-answer">
      {children}
    </motion.button>
  );
}

/** The quieter "Skip" chip. */
export function SkipChip({ children = "Skip", onClick }: { children?: ReactNode; onClick: () => void }) {
  return (
    <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} onClick={onClick} className="rx-chip-skip">
      {children}
    </motion.button>
  );
}

/** Two-column goal picker for the composer's chips slot (title + one-line description). */
export function GoalOptionCards({
  question,
  options,
  onPick,
  footnote = "Or type your own goal in the box below.",
}: {
  question: string;
  options: { label: string; description: string }[];
  onPick: (label: string) => void;
  footnote?: ReactNode;
}) {
  if (options.length === 0) return null;
  return (
    <div style={{ width: "100%" }}>
      <p className="rx-goals__q">{question}</p>
      <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="rx-goals">
        {options.map((opt) => (
          <motion.button
            key={opt.label}
            type="button"
            variants={fadeInUp}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onPick(opt.label)}
            className="rx-goal"
          >
            <p className="rx-goal__title">{opt.label}</p>
            <p className="rx-goal__desc">{opt.description}</p>
          </motion.button>
        ))}
      </motion.div>
      <p className="rx-goals__foot">{footnote}</p>
    </div>
  );
}
