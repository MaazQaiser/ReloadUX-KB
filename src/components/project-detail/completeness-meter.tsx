import { COMPLETENESS_FIELD_LABELS, type Completeness } from "@/lib/completeness";
import { DetailSection } from "./section";

export function CompletenessMeter({ completeness }: { completeness: Completeness }) {
  const { score, filled, total, missing } = completeness;
  return (
    <div className="rx-corner-glow border border-white/10 p-5">
      <DetailSection title="Completeness">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-heading text-4xl">{score}%</span>
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
          className="h-1 overflow-hidden bg-muted"
        >
          <div className="h-full bg-linear-to-r from-rx-purple to-rx-lilac" style={{ width: `${score}%` }} />
        </div>
        {missing.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Missing: {missing.map((field) => COMPLETENESS_FIELD_LABELS[field]).join(", ")}.
          </p>
        )}
      </DetailSection>
    </div>
  );
}
