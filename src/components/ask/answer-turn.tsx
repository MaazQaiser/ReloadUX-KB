import Link from "next/link";
import { UxAvatar } from "@/components/ux-avatar";
import { AnswerFeedback } from "./answer-feedback";
import { AnswerProjectCard } from "./answer-project-card";
import { ThinkingDots } from "./thinking-dots";
import type { Turn } from "./use-ask";
import { VerdictBadge } from "./verdict-badge";

// Pulse rises each new turn 12px into place.
const ENTER = "animate-in fade-in-0 slide-in-from-bottom-3 duration-350 ease-pulse motion-reduce:animate-none";

export function AnswerTurn({ turn, onOpenProject }: { turn: Turn; onOpenProject: (slug: string) => void }) {
  const streaming = turn.state === "streaming";
  const waiting = streaming && !turn.text && turn.projects.length === 0;

  return (
    <li className="flex flex-col gap-8">
      {/* The user's turn: a solid ink bubble whose sharp top-right corner is the speech tail. */}
      <p
        className={`max-w-[45rem] self-end rounded-2xl rounded-tr-md bg-primary px-5 py-3 text-base leading-relaxed whitespace-pre-line text-primary-foreground ${ENTER}`}
      >
        <span className="sr-only">You asked: </span>
        {turn.question}
      </p>

      <section aria-label="Answer" aria-busy={streaming} className={`flex min-w-0 items-start gap-3 ${ENTER}`}>
        <UxAvatar />
        <div className="flex min-w-0 flex-1 flex-col gap-4 pt-1">
          {waiting && (
            <p className="flex items-center gap-2 text-base text-foreground/80">
              {turn.status ?? "Thinking"}…
              <ThinkingDots />
            </p>
          )}

          {turn.verdict && <VerdictBadge verdict={turn.verdict} />}

          {turn.text && (
            <p className="text-base leading-relaxed break-words whitespace-pre-line">
              {turn.text}
              {streaming && (
                <span className="ml-2 inline-flex align-middle">
                  <ThinkingDots />
                </span>
              )}
            </p>
          )}

          {turn.projects.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2" aria-label="Matching projects">
              {turn.projects.map((project) => (
                <li key={project.slug}>
                  <AnswerProjectCard project={project} onOpen={onOpenProject} />
                </li>
              ))}
            </ul>
          )}

          {turn.state === "stopped" && <p className="text-sm text-foreground/60">Stopped.</p>}
          {turn.state === "error" && (
            <p role="alert" className="text-destructive">
              {turn.error}
            </p>
          )}

          {turn.state === "done" && (
            <div className="flex flex-col gap-4">
              {turn.records.length > 0 && (
                <p className="text-sm text-foreground/60">
                  Records used:{" "}
                  {turn.records.map((record, index) => (
                    <span key={record.slug}>
                      {index > 0 && ", "}
                      <Link
                        href={`/projects/${record.slug}`}
                        className="text-foreground/70 underline decoration-border underline-offset-4 transition-colors duration-300 hover:text-foreground hover:decoration-foreground/40"
                      >
                        {record.name}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
              {turn.turnId && <AnswerFeedback turnId={turn.turnId} />}
            </div>
          )}
        </div>
      </section>
    </li>
  );
}
