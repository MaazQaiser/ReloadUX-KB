import { COMPLETENESS_FIELD_LABELS, type Completeness } from "@/lib/completeness";
import { DetailSection } from "./section";

export function CompletenessMeter({ completeness }: { completeness: Completeness }) {
  const { score, filled, total, missing } = completeness;
  return (
    <DetailSection title="Completeness">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-2xl font-semibold">{score}%</span>
        <span className="text-muted-foreground">
          {filled} of {total} optional fields
        </span>
      </div>
      <div
        role="meter"
        aria-label="Record completeness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
      </div>
      {missing.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Missing: {missing.map((field) => COMPLETENESS_FIELD_LABELS[field]).join(", ")}.
        </p>
      )}
    </DetailSection>
  );
}
