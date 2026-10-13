import type { Metadata } from "next";
import { Suspense } from "react";
import { DetailSection } from "@/components/project-detail/section";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { GapItem } from "@/components/review/gap-item";
import { VerifiedAnswerForm } from "@/components/review/verified-answer-form";
import { VerifiedAnswerItem } from "@/components/review/verified-answer-item";
import { requireRole } from "@/server/auth";
import { listOpenGaps, listVerifiedAnswers } from "@/server/services/learning";
import { listProjectOptions } from "@/server/services/projects";

export const metadata: Metadata = { title: "review" };

export default function ReviewPage() {
  return (
    <div className="flex flex-col gap-10">
      <p className="max-w-3xl text-soft-foreground">
        What the agent is learning: questions it couldn&apos;t answer, answers the team has approved, and suggested tags.
      </p>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ReviewView />
      </Suspense>
    </div>
  );
}

async function ReviewView() {
  await requireRole("admin");
  const [gaps, answers, projects] = await Promise.all([listOpenGaps(), listVerifiedAnswers(), listProjectOptions()]);

  return (
    <div className="flex flex-col gap-12">
      <DetailSection title={`Knowledge gaps (${gaps.length})`}>
        {gaps.length === 0 ? (
          <p className="text-sm text-soft-foreground">
            Nothing open. Questions land here when someone gives a real answer a thumbs down; once the agent is
            connected, also when it answers No with low confidence, a field isn&apos;t recorded, or the same question is
            asked again within a minute. Resolve each by fixing a record, adding a project or tag, or writing a verified
            answer below.
          </p>
        ) : (
          <ul className="flex flex-col border-t">
            {gaps.map((gap) => (
              <GapItem
                key={gap.id}
                gap={{ id: gap.id, question: gap.question, reason: gap.reason, note: gap.note, asked: formatDate(gap.created_at) }}
              />
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title={`Verified answers (${answers.length})`}>
        <p className="text-sm text-soft-foreground">
          Approved answers the agent starts from when a new question is very similar. It still checks the linked
          projects are current before answering.
        </p>
        <div className="rx-corner-glow border border-white/10 p-6">
          <VerifiedAnswerForm projects={projects} />
        </div>
        {answers.length > 0 && (
          <ul className="flex flex-col border-t">
            {answers.map((answer) => (
              <VerifiedAnswerItem
                key={answer.id}
                projects={projects}
                answer={{
                  id: answer.id,
                  question: answer.question,
                  answer: answer.answer,
                  project_slugs: answer.project_slugs,
                  updated: formatDate(answer.updated_at),
                }}
              />
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Tag suggestions (0)">
        <p className="text-sm text-soft-foreground">
          A weekly job reads new projects and proposes missing tags, such as an onboarding flow with no onboarding tag.
          Accept or reject each one here. It runs once the Anthropic key is connected.
        </p>
      </DetailSection>
    </div>
  );
}
