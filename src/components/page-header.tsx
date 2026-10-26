import type { ReactNode } from "react";

/** Pulse page opening: a small tracked label, one italic serif display line, an ink/60 intro. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-3xl flex-col gap-3">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="font-heading text-3xl leading-tight italic sm:text-4xl">{title}</h1>
        {description && <p className="text-base leading-relaxed text-foreground/60">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs tracking-wide text-pulse-muted uppercase">{children}</p>;
}
