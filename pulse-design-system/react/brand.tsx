import type { ReactNode } from "react";
import { cx } from "./cx";

/** Typographic wordmark: regular "reload" + bold "ux". Never an image. */
export function Logo({ size = "landing", className }: { size?: "landing" | "header"; className?: string }) {
  return (
    <span className={cx("rx-logo", `rx-logo--${size}`, className)}>
      reload<b>ux</b>
    </span>
  );
}

/** The AI's "UX" avatar (image comes from the stylesheet, no import needed). */
export function Avatar({ size = "md", className }: { size?: "md" | "lg"; className?: string }) {
  return <span role="img" aria-label="ReloadUX" className={cx("rx-avatar", size === "lg" && "rx-avatar--lg", className)} />;
}

/**
 * Wraps any Pulse UI. Applies the font, ink colour and the scoped reset from
 * base.css. `page` also gives it the app's full-height page background.
 */
export function PulseRoot({
  children,
  page = false,
  className,
}: {
  children: ReactNode;
  page?: boolean;
  className?: string;
}) {
  return <div className={cx("pulse", page && "pulse-page", className)}>{children}</div>;
}
