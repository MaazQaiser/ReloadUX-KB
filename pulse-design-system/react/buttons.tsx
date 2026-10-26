"use client";

import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cx } from "./cx";

type ButtonVariant = "primary" | "secondary" | "report" | "white";

// Hover/tap feel per variant, as the app uses them.
const MOTION: Record<ButtonVariant, { whileHover: { y?: number; scale?: number }; whileTap: { scale: number } }> = {
  primary: { whileHover: { y: -2 }, whileTap: { scale: 0.96 } },
  secondary: { whileHover: { y: -2 }, whileTap: { scale: 0.96 } },
  report: { whileHover: { scale: 1.04 }, whileTap: { scale: 0.96 } },
  white: { whileHover: { scale: 1.04 }, whileTap: { scale: 0.96 } },
};

export type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: ButtonVariant;
  /** Larger padding (px-7 py-3.5): the report's final CTA and the unlock card. */
  size?: "md" | "lg";
  /** Bold label (the white button inside the unlock card). */
  bold?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
};

/**
 * Pill buttons. primary = solid ink · secondary = ink outline that fills on
 * hover · report = bold ink with shadow lift (Download PDF) · white = on the
 * dark gradient cards.
 */
export function Button({ variant = "primary", size = "md", bold, icon, children, className, ...rest }: ButtonProps) {
  const m = MOTION[variant];
  const disabled = Boolean(rest.disabled);
  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : m.whileHover}
      whileTap={disabled ? undefined : m.whileTap}
      {...rest}
      className={cx("rx-btn", `rx-btn--${variant}`, size === "lg" && "rx-btn--lg", className)}
      style={{ ...(bold ? { fontWeight: 700 } : null), ...(rest.style as object) }}
    >
      {icon}
      {children}
    </motion.button>
  );
}

/** A link styled as a pill (e.g. "Talk to an expert" → reloadux.com/contact). */
export function LinkButton({
  variant = "white",
  size = "md",
  bold,
  href,
  target = "_blank",
  children,
  className,
}: {
  variant?: ButtonVariant;
  size?: "md" | "lg";
  bold?: boolean;
  href: string;
  target?: string;
  children: ReactNode;
  className?: string;
}) {
  const m = MOTION[variant];
  return (
    <motion.a
      href={href}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      whileHover={m.whileHover}
      whileTap={m.whileTap}
      className={cx("rx-btn", `rx-btn--${variant}`, size === "lg" && "rx-btn--lg", className)}
      style={bold ? { fontWeight: 700 } : undefined}
    >
      {children}
    </motion.a>
  );
}

type IconButtonVariant = "send-lg" | "send" | "outline-lg" | "outline" | "nav" | "ghost";

/** Round icon buttons: 44/40px sends, outlined attach/mic, 36px carousel nav, 32px ghost. */
export function IconButton({
  variant,
  label,
  children,
  className,
  ...rest
}: Omit<HTMLMotionProps<"button">, "children"> & { variant: IconButtonVariant; label: string; children: ReactNode }) {
  const disabled = Boolean(rest.disabled);
  const feel =
    variant === "send-lg"
      ? { whileHover: disabled ? undefined : { x: 2 }, whileTap: disabled ? undefined : { scale: 0.94 } }
      : variant === "nav"
        ? { whileHover: { scale: 1.08 }, whileTap: { scale: 0.9 } }
        : {};
  return (
    <motion.button
      type="button"
      aria-label={label}
      {...feel}
      {...rest}
      className={cx("rx-icon-btn", `rx-icon-btn--${variant}`, className)}
    >
      {children}
    </motion.button>
  );
}
