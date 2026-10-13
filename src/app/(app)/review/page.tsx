import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DetailSection } from "@/components/project-detail/section";
import { ApproveDraftForm } from "@/components/review/approve-draft-form";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCompleteness } from "@/lib/completeness";
import { INDUSTRY } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { GapItem } from "@/components/review/gap-item";
import { VerifiedAnswerForm } from "@/components/review/verified-answer-form";
import { VerifiedAnswerItem } from "@/components/review/verified-answer-item";
import { requireRole } from "@/server/auth";
import { listOpenGaps, listVerifiedAnswers } from "@/server/services/learning";
import { listProjectOptions } from "@/server/services/projects";
import { listDrafts } from "@/server/services/review";

export const metadata: Metadata = { title: "review" };

export default function ReviewPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Admin"
        title="Review queue"
        description="Nothing goes live until someone checks it. Drafts from imports and admin chat, questions the agent couldn't answer, and suggested tags all land here."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ReviewView />
      </Suspense>
    </div>
  );
}

async function ReviewView() {
  await requireRole("admin");
  const [drafts, gaps, answers, projects] = await Promise.all([
    listDrafts(),
    listOpenGaps(),
    listVerifiedAnswers(),
    listProjectOptions(),
  ]);

  return (
    <div className="flex flex-col gap-12">
      <DetailSection title={`Project drafts (${drafts.length})`}>
        {drafts.length === 0 ? (
          <p className="text-sm text-soft-foreground">
            No drafts waiting. Drafts arrive from the Notion and Sheets import and from admin chat.
          </p>
        ) : (
          <ul className="flex flex-col border-t">
            {drafts.map((draft) => {
              const { score } = getCompleteness(draft);
              return (
                <li key={draft.id} className="flex flex-col gap-4 border-b py-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
                      {INDUSTRY.labels[draft.industry]} · {score}% complete · updated {formatDate(draft.updated_at)}
                    </p>
                    <h3 className="font-heading text-2xl">{draft.name}</h3>
                    <p className="max-w-2xl text-soft-foreground">{draft.summary}</p>
                  </div>
                  <div className="flex shrink-0 items-start gap-3">
                    <Link href={`/projects/${draft.slug}/edit`} className={buttonVariants({ variant: "outline" })}>
                      Review and edit
                    </Link>
                    <ApproveDraftForm projectId={draft.id} name={draft.name} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DetailSection>

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
        <div className="border border-dashed p-6">
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
