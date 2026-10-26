import { COMPLETENESS_FIELD_LABELS, type Completeness } from "@/lib/completeness";
import { ReportEyebrow } from "./section";

/** Pulse's "Confidence Signal" callout: how much of the record there is to rely on. */
export function CompletenessMeter({ completeness }: { completeness: Completeness }) {
  const { score, filled, total, missing } = completeness;
  return (
    <section aria-label="Completeness" className="flex flex-col gap-3 border-l-[3px] border-(--pulse-border-accent) bg-pulse-accent-faint px-6 py-5">
      <ReportEyebrow className="tracking-[0.12em]">Completeness</ReportEyebrow>
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-heading text-[40px] leading-none font-bold tracking-[-0.02em] text-pulse-accent tabular-nums">
          {score}%
        </span>
        <span className="text-[11.5px] text-pulse-secondary">
          {filled} of {total} optional fields
        </span>
      </div>
      <div
        role="meter"
        aria-label="Record completeness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        className="h-1 overflow-hidden bg-pulse-rule"
      >
        <div className="h-full bg-pulse-accent" style={{ width: `${score}%` }} />
      </div>
      {missing.length > 0 && (
        <p className="text-[13px] leading-[1.6] text-pulse-secondary">
          <span className="font-bold text-foreground">Missing:</span>{" "}
          {missing.map((field) => COMPLETENESS_FIELD_LABELS[field]).join(", ")}.
        </p>
      )}
    </section>
  );
}
