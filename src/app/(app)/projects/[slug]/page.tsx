import type { Metadata } from "next";
import { ArrowLeft, Pencil } from "lucide-react";
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
      <Link
        href="/projects"
        className="flex w-fit items-center gap-2 rounded-full text-sm text-foreground/60 transition-colors duration-300 outline-none hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/15"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All projects
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
    // Pulse's report frame: the record reads as a square, ruled document, not a chat card.
    <article className="border border-pulse-rule bg-background px-6 py-8 animate-in fade-in-0 slide-in-from-bottom-5 duration-400 ease-pulse sm:px-12 sm:py-12 motion-reduce:animate-none">
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <ProjectHeader project={detail.project} catalog={catalog} />
        {hasRole(user.role, "editor") && (
          <Link href={`/projects/${detail.project.slug}/edit`} className={buttonVariants({ className: "font-bold" })}>
            <Pencil aria-hidden />
            Edit project
          </Link>
        )}
      </div>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-0">
        <ProjectMain project={detail.project} gallery={gallery} catalog={catalog} />
        <div className="lg:border-l lg:border-pulse-rule lg:pl-10 lg:ml-10">
          <ProjectSidebar detail={detail} />
        </div>
      </div>
    </article>
  );
}
