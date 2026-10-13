import type { ReactNode } from "react";
import { Eyebrow } from "./page-header";

/**
 * Full-width message for not found, no access and error pages, set like the
 * "Ready to design" band on reloadux.com: centred, purple light behind it.
 */
export function StatusScreen({
  eyebrow,
  title,
  description,
  action,
  role,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  role?: "alert";
}) {
  return (
    <div role={role} className="rx-glow-band flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center sm:py-32">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="max-w-2xl text-4xl leading-tight sm:text-5xl">{title}</h1>
      <p className="max-w-xl text-lg text-soft-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
