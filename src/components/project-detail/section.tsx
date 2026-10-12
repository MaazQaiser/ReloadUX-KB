import type { ReactNode } from "react";

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  const id = `section-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 border-t pt-6">
      {/* Section labels follow the site's small grey caps; h2 keeps the outline for screen readers. */}
      <h2 id={id} className="font-sans text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
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
  return <dl className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-6 gap-y-3 text-sm">{children}</dl>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children ?? <NotRecorded />}</dd>
    </>
  );
}
