import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DetailSkeleton } from "@/components/project-detail/detail-skeleton";
import { ProjectHeader, ProjectMain } from "@/components/project-detail/project-main";
import { ProjectSidebar } from "@/components/project-detail/project-sidebar";
import { hasRole } from "@/lib/auth-rules";
import { slugSchema } from "@/schemas/common";
import { requireRole } from "@/server/auth";
import { getProjectDetail } from "@/server/services/projects";

export const metadata: Metadata = { title: "project" };

export default function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">
        ← All projects
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <ProjectView params={params} />
      </Suspense>
    </div>
  );
}

async function ProjectView({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireRole("viewer");
  const slug = slugSchema.safeParse((await params).slug);
  if (!slug.success) notFound();

  const detail = await getProjectDetail(slug.data);
  if (!detail) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <ProjectHeader project={detail.project} />
        {hasRole(user.role, "editor") && (
          <Link
            href={`/projects/${detail.project.slug}/edit`}
            className="shrink-0 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Edit project
          </Link>
        )}
      </div>
      <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <ProjectMain project={detail.project} />
        <ProjectSidebar detail={detail} />
      </div>
    </div>
  );
}
