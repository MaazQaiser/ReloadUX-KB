import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { DetailSkeleton } from "@/components/project-detail/detail-skeleton";
import { ProjectHeader, ProjectMain } from "@/components/project-detail/project-main";
import { ProjectSidebar } from "@/components/project-detail/project-sidebar";
import { hasRole } from "@/lib/auth-rules";
import { slugSchema } from "@/schemas/common";
import { requireRole } from "@/server/auth";
import { getProjectDetail } from "@/server/services/projects";
import { getTagCatalog } from "@/server/services/tags";
import { getProjectGallery } from "@/server/services/visuals";

export const metadata: Metadata = { title: "project" };

export default function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/projects" className="text-sm text-soft-foreground hover:text-foreground">
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
  const [gallery, catalog] = await Promise.all([getProjectGallery(detail.project.id), getTagCatalog()]);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <ProjectHeader project={detail.project} catalog={catalog} />
        {hasRole(user.role, "editor") && (
          <Link href={`/projects/${detail.project.slug}/edit`} className={buttonVariants({ variant: "outline" })}>
            Edit project
          </Link>
        )}
      </div>
      <div className="grid gap-16 lg:grid-cols-[1fr_22rem]">
        <ProjectMain project={detail.project} gallery={gallery} catalog={catalog} />
        <ProjectSidebar detail={detail} />
      </div>
    </div>
  );
}
