import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Pulse report headings: "section" is the violet serif that opens the record,
 * "topic" the ink serif for the parts after it, "eyebrow" the small violet caps
 * used in the side column.
 */
type Level = "section" | "topic" | "eyebrow";

const HEADING: Record<Level, string> = {
  section: "font-heading text-[28px] leading-[1.1] font-bold tracking-[-0.02em] text-pulse-accent sm:text-[34px]",
  topic: "font-heading text-[28px] leading-[1.08] font-bold tracking-[-0.02em] sm:text-[34px]",
  eyebrow: "text-[11px] font-bold tracking-[0.16em] text-pulse-accent uppercase",
};

export function DetailSection({
  title,
  level = "eyebrow",
  children,
}: {
  title: string;
  level?: Level;
  children: ReactNode;
}) {
  const id = `section-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className={cn("flex flex-col", level === "eyebrow" ? "gap-3" : "gap-4")}>
      <h2 id={id} className={HEADING[level]}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Pulse's report eyebrow, for labels that aren't section headings. */
export function ReportEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[11px] font-bold tracking-[0.16em] text-pulse-accent uppercase", className)}>{children}</p>;
}

/** The spec's rule for gaps: say so plainly rather than leave a blank or guess. */
export function NotRecorded() {
  return <span className="text-pulse-tertiary italic">not recorded</span>;
}

/** Label and value rows, ruled like the report's tables. */
export function FieldList({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] border-t border-pulse-rule text-[13px] leading-[1.5] [&>*]:border-b [&>*]:border-pulse-rule [&>*]:py-3">
      {children}
    </dl>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="pr-4 text-pulse-tertiary">{label}</dt>
      <dd className="min-w-0 text-foreground">{children ?? <NotRecorded />}</dd>
    </>
  );
}
