import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DetailSection } from "@/components/project-detail/section";
import { ApproveDraftForm } from "@/components/review/approve-draft-form";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { hasRole } from "@/lib/auth-rules";
import { getCompleteness } from "@/lib/completeness";
import { tagLabel } from "@/lib/tag-catalog";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/server/auth";
import { listDrafts } from "@/server/services/review";
import { getTagCatalog } from "@/server/services/tags";

export const metadata: Metadata = { title: "drafts" };

export default function DraftsPage() {
  return (
    <div className="flex flex-col gap-10">
      <p className="max-w-3xl text-soft-foreground">
        Projects waiting for review, from imports and admin chat. Nothing goes live until someone checks it; saving a
        draft from its edit page approves it.
      </p>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <DraftsView />
      </Suspense>
    </div>
  );
}

async function DraftsView() {
  const user = await requireRole("editor");
  const [drafts, catalog] = await Promise.all([listDrafts(), getTagCatalog()]);
  const canApprove = hasRole(user.role, "admin");

  return (
      <DetailSection title={`Waiting for review (${drafts.length})`}>
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
                      {tagLabel(catalog.industry, draft.industry)} · {score}% complete · updated {formatDate(draft.updated_at)}
                    </p>
                    <h3 className="text-lg font-medium">{draft.name}</h3>
                    <p className="max-w-2xl text-soft-foreground">{draft.summary}</p>
                  </div>
                  <div className="flex shrink-0 items-start gap-3">
                    <Link href={`/projects/${draft.slug}/edit`} className={buttonVariants({ variant: "outline" })}>
                      Review and edit
                    </Link>
                    {canApprove && <ApproveDraftForm projectId={draft.id} name={draft.name} />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DetailSection>
  );
}
