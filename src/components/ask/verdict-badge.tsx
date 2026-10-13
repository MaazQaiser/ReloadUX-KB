import { Badge } from "@/components/ui/badge";
import { ANSWER_VERDICT } from "@/lib/constants";
import type { AnswerVerdict } from "@/schemas/answer";

const VARIANT = { yes: "default", partly: "secondary", no: "outline" } as const;

export function VerdictBadge({ verdict }: { verdict: AnswerVerdict }) {
  return (
    <Badge variant={VARIANT[verdict]} className="h-6 px-3 text-sm">
      {ANSWER_VERDICT.labels[verdict]}
    </Badge>
  );
}
