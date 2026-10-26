"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Paperclip, X } from "./icons";
import { Logo } from "./brand";
import { CyclingWord } from "./chat";
import { ThemeToggle } from "./theme";
import { cx } from "./cx";

export type LandingInputSubmission = { mode: "url"; url: string } | { mode: "image" | "pdf"; file: File };

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * The fat landing input: typed text is a URL, an attached/dropped file is an
 * image or PDF. Paperclip shows only while empty; send stays at 30% until
 * the input is valid.
 */
export function LandingInput({
  onSubmit,
  disabled,
  placeholder = "Paste a URL",
  acceptFiles = true,
}: {
  onSubmit: (input: LandingInputSubmission) => void;
  disabled?: boolean;
  placeholder?: string;
  acceptFiles?: boolean;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const textIsUrl = isValidUrl(text);
  const textLooksLikeAttempt = text.trim().length > 0 && !textIsUrl;
  const isValid = !!file || textIsUrl;

  function acceptFile(f: File) {
    const isImage = f.type.startsWith("image/");
    const isPdf = f.type === "application/pdf";
    if (!isImage && !isPdf) return; // unsupported types are silently ignored
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setText("");
    setPreviewUrl(isImage ? URL.createObjectURL(f) : null);
  }

  function removeFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
  }

  function handleSubmit() {
    if (disabled) return;
    if (file) onSubmit({ mode: file.type.startsWith("image/") ? "image" : "pdf", file });
    else if (textIsUrl) onSubmit({ mode: "url", url: text.trim() });
  }

  return (
    <div style={{ width: "100%" }}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && acceptFiles) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (disabled || !acceptFiles) return;
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) acceptFile(dropped);
        }}
        className={cx("rx-landing-input", isDragOver && "is-dragover")}
      >
        {acceptFiles && !file && text.trim().length === 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            aria-label="Attach an image or PDF"
            className="rx-icon-btn rx-icon-btn--outline-lg"
          >
            <Paperclip strokeWidth={1.75} />
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) acceptFile(f);
            e.target.value = "";
          }}
          hidden
        />

        {file ? (
          <div className="rx-landing-input__file">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="rx-landing-input__thumb" />
            ) : (
              <span className="rx-landing-input__fileicon">
                <FileText className="rx-icon rx-icon--lg" strokeWidth={1.5} />
              </span>
            )}
            <span className="rx-landing-input__name">{file.name}</span>
            <button type="button" onClick={removeFile} disabled={disabled} aria-label="Remove attached file" className="rx-icon-btn rx-icon-btn--ghost">
              <X strokeWidth={1.75} />
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={disabled}
            placeholder={placeholder}
          />
        )}

        <motion.button
          type="button"
          whileHover={isValid && !disabled ? { x: 2 } : undefined}
          whileTap={isValid && !disabled ? { scale: 0.94 } : undefined}
          onClick={handleSubmit}
          disabled={!isValid || disabled}
          aria-label="Start the audit"
          className="rx-icon-btn rx-icon-btn--send-lg"
        >
          <ArrowRight />
        </motion.button>
      </div>

      {textLooksLikeAttempt && (
        <p className="rx-landing-input__hint">That doesn&apos;t look like a full URL yet — try starting with http:// or https://.</p>
      )}
    </div>
  );
}

/**
 * The whole landing screen: themed backdrop, logo + link, the italic hero
 * ("Hello, I am Pulse, I can do quick audit for your {Website…}"), the input,
 * the note, and the floating theme toggle. Every piece is overridable.
 */
export function LandingPage({
  onSubmit,
  disabled,
  name = "Pulse",
  lead = "Hello, I am",
  tail = ", I can do quick audit for your",
  nouns = ["Website", "App", "Product", "SaaS"],
  note = "Every audit runs the basic tier: hand over a URL, image, PDF, or flow of screenshots, answer one or two questions, and get a findings report with a recommendation for each issue.",
  link = { href: "https://reloadux.com", label: "reloadux.com" },
  logo,
  themeToggle = true,
}: {
  onSubmit: (input: LandingInputSubmission) => void;
  disabled?: boolean;
  name?: string;
  lead?: string;
  tail?: string;
  nouns?: string[];
  note?: ReactNode;
  link?: { href: string; label: string } | null;
  logo?: ReactNode;
  themeToggle?: boolean;
}) {
  return (
    <main className="rx-landing rx-landing-bg">
      <div className="rx-landing__top">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rx-landing__top-row"
        >
          {logo ?? <Logo size="landing" />}
          {link && (
            <nav>
              <a href={link.href} target="_blank" rel="noreferrer" className="rx-landing__link">
                {link.label}
              </a>
            </nav>
          )}
        </motion.header>
      </div>

      <div className="rx-landing__center">
        <div className="rx-landing__inner">
          <div className="rx-landing__col">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="rx-hero"
            >
              {lead} <span className="rx-gradient-text">{name}</span>
              {tail} <CyclingWord words={nouns} />
            </motion.h1>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
              <LandingInput onSubmit={onSubmit} disabled={disabled} />
            </motion.div>

            {note && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="rx-landing__note"
              >
                {note}
              </motion.p>
            )}
          </div>
        </div>
      </div>

      {themeToggle && <ThemeToggle variant="floating" />}
    </main>
  );
}
