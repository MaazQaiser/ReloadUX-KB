import type { Metadata } from "next";
import { Suspense } from "react";
import { AskChat } from "@/components/ask/ask-chat";
import { PageHeader } from "@/components/page-header";
import { PreviewBadge } from "@/components/preview-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { STARTER_QUESTIONS } from "@/lib/constants";
import { requireRole } from "@/server/auth";

export const metadata: Metadata = { title: "ask" };

export default function AskPage() {
  return (
    <div className="flex flex-1 flex-col gap-10">
      <PageHeader
        eyebrow="Ask"
        title="What have we built?"
        description="Ask about past projects in plain words. Answers start with Yes, Partly or No, and link to the records they used."
        actions={<PreviewBadge />}
      />
      <Suspense fallback={<AskSkeleton />}>
        <AskView />
      </Suspense>
    </div>
  );
}

async function AskView() {
  await requireRole("viewer");
  return <AskChat starters={STARTER_QUESTIONS} />;
}

function AskSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <Skeleton className="h-4 w-24" />
      <div className="grid gap-px sm:grid-cols-2">
        {STARTER_QUESTIONS.map((starter) => (
          <Skeleton key={starter} className="h-20" />
        ))}
      </div>
    </div>
  );
}
