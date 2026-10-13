import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DetailSection } from "@/components/project-detail/section";
import { TagBadges } from "@/components/tag-badges";
import { Skeleton } from "@/components/ui/skeleton";
import { getIntegrations } from "@/env";
import { INDUSTRY, PRODUCT_TYPE } from "@/lib/constants";
import { requireRole } from "@/server/auth";
import { listFigmaFilesByProject } from "@/server/services/visuals";

export const metadata: Metadata = { title: "visuals" };

export default function VisualsPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Visual library"
        title="Screens we've designed."
        description="Search final screens across every project, like “healthcare onboarding”, and jump to the Figma frame behind each one."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <VisualsView />
      </Suspense>
    </div>
  );
}

async function VisualsView() {
  await requireRole("viewer");
  const [figma, { r2 }] = await Promise.all([listFigmaFilesByProject(), getIntegrations()]);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col items-start gap-3 border border-dashed p-8">
        <h2 className="text-2xl">No screenshots yet</h2>
        <p className="max-w-2xl text-soft-foreground">
          {r2
            ? "Storage is connected. Uploads on each project's page will appear here, captioned and searchable."
            : "Screenshot uploads need Cloudflare R2, which isn't connected yet. Once it is, editors upload 3 to 8 final screens per project and they appear here, captioned and searchable."}
        </p>
      </div>

      <DetailSection title={`Figma files on record (${figma.reduce((sum, item) => sum + item.files.length, 0)})`}>
        {figma.length === 0 ? (
          <p className="text-sm text-soft-foreground">No project has a Figma file recorded yet.</p>
        ) : (
          <ul className="grid border-t border-l sm:grid-cols-2 lg:grid-cols-3">
            {figma.map(({ project, files }) => (
              <li key={project.id} className="flex flex-col gap-3 border-r border-b p-6">
                <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">{INDUSTRY.labels[project.industry]}</p>
                <Link href={`/projects/${project.slug}`} className="font-heading text-2xl underline-offset-4 hover:underline">
                  {project.name}
                </Link>
                <TagBadges list={PRODUCT_TYPE} values={project.product_types} variant="outline" />
                <ul className="mt-auto flex flex-col gap-1 border-t pt-3 text-sm">
                  {files.map((file) => (
                    <li key={file.url}>
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                        {file.label}
                        <span className="sr-only"> (opens Figma in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </div>
  );
}
