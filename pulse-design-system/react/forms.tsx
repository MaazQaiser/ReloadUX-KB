"use client";

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { Upload } from "./icons";
import { cx } from "./cx";
import { springs } from "./motion";

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label className="rx-label" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

/** Rounded text field; focus = ink border + 4px ink/5 ring; `invalid` = red. */
export function Field({ invalid, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input {...rest} className={cx("rx-field", invalid && "is-invalid", className)} />;
}

export function TextArea({ invalid, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea {...rest} className={cx("rx-field", invalid && "is-invalid", className)} />;
}

export function FieldError({ children }: { children: ReactNode }) {
  return <p className="rx-field-error">{children}</p>;
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="rx-field-hint" style={{ marginTop: 8 }}>{children}</p>;
}

/** Dashed upload target. */
export function Dropzone({
  children = "Choose a file…",
  accept,
  multiple,
  onFiles,
}: {
  children?: ReactNode;
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
}) {
  return (
    <label className="rx-dropzone">
      <Upload strokeWidth={1.5} />
      {children}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </label>
  );
}

/**
 * Pill selector with a sliding ink background on the active option (shared
 * layoutId, spring 400/32). Options can carry a small "recommended" tag.
 */
export function ModePills<T extends string>({
  options,
  value,
  onChange,
  id = "pulse-mode-pill",
}: {
  options: { value: T; label: string; recommended?: boolean }[];
  value: T;
  onChange: (value: T) => void;
  /** Unique per instance if you render more than one on a page. */
  id?: string;
}) {
  return (
    <div className="rx-pills">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="rx-pill"
            // The ink fill is the sliding span below; keep the button itself transparent.
            style={active ? { borderColor: "var(--pulse-border-ink)", color: "var(--pulse-surface)", background: "transparent", boxShadow: "none" } : undefined}
          >
            {active && (
              <motion.span
                layoutId={id}
                transition={springs.modePill}
                style={{ position: "absolute", inset: 0, background: "var(--pulse-ink)", boxShadow: "var(--pulse-shadow-soft)" }}
              />
            )}
            <span style={{ position: "relative", zIndex: 10 }}>
              {opt.label}
              {opt.recommended && <span className="rx-pill__tag">recommended</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Zebra list of flow steps inside a rounded, shadowed frame. */
export function FlowStepList({
  steps,
}: {
  steps: { id: string; label: string; thumbnail?: string; badge?: string; actions?: ReactNode }[];
}) {
  return (
    <ol className="rx-steps">
      {steps.map((step, i) => (
        <motion.li
          key={step.id}
          layout
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={springs.flowReorder}
        >
          {step.thumbnail ? <img src={step.thumbnail} alt="" className="rx-steps__thumb" /> : <span className="rx-steps__thumb" />}
          <span className="rx-steps__n">{i + 1}</span>
          <span className="rx-steps__label">{step.label}</span>
          {step.badge && <span className="rx-badge">{step.badge}</span>}
          {step.actions}
        </motion.li>
      ))}
    </ol>
  );
}
