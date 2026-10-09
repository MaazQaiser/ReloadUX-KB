import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DetailSkeleton } from "@/components/project-detail/detail-skeleton";
import { ProjectHeader, ProjectMain } from "@/components/project-detail/project-main";
import { ProjectSidebar } from "@/components/project-detail/project-sidebar";
import { slugSchema } from "@/schemas/common";
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
  const slug = slugSchema.safeParse((await params).slug);
  if (!slug.success) notFound();
  // Database reads are always per request; the driver's internal clock reads would otherwise trip prerendering.
  await connection();

  const detail = await getProjectDetail(slug.data);
  if (!detail) notFound();

  return (
    <div className="flex flex-col gap-8">
      <ProjectHeader project={detail.project} />
      <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <ProjectMain project={detail.project} />
        <ProjectSidebar detail={detail} />
      </div>
    </div>
  );
}
