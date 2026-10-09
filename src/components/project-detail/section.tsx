import type { ReactNode } from "react";

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  const id = `section-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** The spec's rule for gaps: say so plainly rather than leave a blank or guess. */
export function NotRecorded() {
  return <span className="text-muted-foreground italic">not recorded</span>;
}

export function FieldList({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-2 text-sm">{children}</dl>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children ?? <NotRecorded />}</dd>
    </>
  );
}
