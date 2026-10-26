import type { ReactNode } from "react";
import { Eyebrow } from "./page-header";

/**
 * Full-width message for not found, no access and error pages: Pulse's one
 * italic serif line, centred, with a calm ink/60 explanation.
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
    <div role={role} className="flex flex-1 animate-in flex-col items-center justify-center gap-6 px-4 py-24 text-center duration-500 ease-pulse fade-in-0 slide-in-from-bottom-5 sm:py-32 motion-reduce:animate-none">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="max-w-2xl font-heading text-3xl leading-tight italic sm:text-5xl">{title}</h1>
      <p className="max-w-xl text-base leading-relaxed text-foreground/60">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
