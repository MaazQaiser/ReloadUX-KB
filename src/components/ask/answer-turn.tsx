import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { AnswerFeedback } from "./answer-feedback";
import { AnswerProjectCard } from "./answer-project-card";
import type { Turn } from "./use-ask";
import { VerdictBadge } from "./verdict-badge";

export function AnswerTurn({ turn }: { turn: Turn }) {
  const streaming = turn.state === "streaming";
  const waiting = streaming && !turn.text && turn.projects.length === 0;

  return (
    <li className="flex flex-col gap-6 border-b pb-10">
      <p className="self-end bg-secondary px-4 py-3 text-secondary-foreground sm:max-w-[80%]">
        <span className="sr-only">You asked: </span>
        {turn.question}
      </p>

      <section aria-label="Answer" aria-busy={streaming} className="flex flex-col gap-5">
        {waiting && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{turn.status ?? "Thinking"}…</p>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {turn.verdict && <VerdictBadge verdict={turn.verdict} />}

        {turn.text && (
          <p className="max-w-3xl text-lg whitespace-pre-line">
            {turn.text}
            {streaming && <span aria-hidden className="ml-0.5 inline-block h-5 w-2 animate-pulse bg-foreground align-middle" />}
          </p>
        )}

        {turn.projects.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Matching projects">
            {turn.projects.map((project) => (
              <li key={project.slug}>
                <AnswerProjectCard project={project} />
              </li>
            ))}
          </ul>
        )}

        {turn.state === "stopped" && <p className="text-sm text-muted-foreground">Stopped.</p>}
        {turn.state === "error" && (
          <p role="alert" className="text-destructive">
            {turn.error}
          </p>
        )}

        {turn.state === "done" && (
          <div className="flex flex-col gap-4 border-t pt-4">
            {turn.records.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Records used:{" "}
                {turn.records.map((record, index) => (
                  <span key={record.slug}>
                    {index > 0 && ", "}
                    <Link href={`/projects/${record.slug}`} className="text-foreground underline underline-offset-4">
                      {record.name}
                    </Link>
                  </span>
                ))}
              </p>
            )}
            {turn.turnId && <AnswerFeedback turnId={turn.turnId} />}
          </div>
        )}
      </section>
    </li>
  );
}
