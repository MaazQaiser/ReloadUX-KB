import type { ReactNode } from "react";

/** The reloadux.com page opening: small grey label, large serif title, soft-grey intro. */
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
    <div className="flex flex-col gap-6 border-b pb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-3xl flex-col gap-4">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="text-4xl leading-tight sm:text-6xl">{title}</h1>
        {description && <p className="text-lg text-soft-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">{children}</p>;
}
