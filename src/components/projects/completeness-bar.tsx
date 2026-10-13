import type { Completeness } from "@/lib/completeness";

/** The small purple meter and percentage shown on project tiles and list rows. */
export function CompletenessBar({ completeness }: { completeness: Completeness }) {
  return (
    <div className="flex items-center gap-2">
      <div
        role="meter"
        aria-label="Record completeness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={completeness.score}
        className="h-1 w-12 overflow-hidden bg-muted"
      >
        <div className="h-full bg-linear-to-r from-rx-purple to-rx-lilac" style={{ width: `${completeness.score}%` }} />
      </div>
      <span className="text-sm text-muted-foreground tabular-nums">{completeness.score}%</span>
    </div>
  );
}
