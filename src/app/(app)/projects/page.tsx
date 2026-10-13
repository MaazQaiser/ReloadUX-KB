import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Pagination } from "@/components/projects/pagination";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFiltersForm } from "@/components/projects/project-filters";
import { PageHeader } from "@/components/page-header";
import { ProjectsSkeleton } from "@/components/projects/projects-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { hasRole } from "@/lib/auth-rules";
import { parseProjectSearch, type ProjectFilters, type RawSearchParams } from "@/schemas/project-filters";
import { requireRole } from "@/server/auth";
import { getGridFilterOptions, listProjectsForGrid } from "@/server/services/projects";
import { getTagCatalog } from "@/server/services/tags";

export const metadata: Metadata = { title: "projects" };

export default function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Project library"
        title="Everything we've built."
        description="Every approved reloadux project, newest delivery first. Search by name or client, or narrow by industry, type, AI feature, flow, designer and year."
      />
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsView searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProjectsView({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requireRole("viewer");
  const parsed = parseProjectSearch(await searchParams);
  const canSeeDrafts = hasRole(user.role, "editor");
  // Drafts are unreviewed, so viewers never get them, whatever the URL says.
  const { review, ...rest } = parsed.filters;
  const filters: ProjectFilters = canSeeDrafts ? parsed.filters : rest;
  const ignored = !canSeeDrafts && review ? [...parsed.ignored, "review"] : parsed.ignored;
  const [page, options, catalog] = await Promise.all([
    listProjectsForGrid(filters, parsed.pagination),
    getGridFilterOptions(),
    getTagCatalog(),
  ]);
  // Show and sort change the view, not which projects match, so they don't count as filters.
  const hasFilters = Object.entries(filters).some(([key, value]) => value !== undefined && key !== "review" && key !== "sort");
  const drafts = filters.review === "draft";
  const noun = drafts ? "draft" : "project";

  return (
    <>
      {/* Keyed on the filters so the inputs reset to the URL after each navigation. */}
      <ProjectFiltersForm
        key={JSON.stringify(filters)}
        filters={filters}
        options={options}
        catalog={catalog}
        canSeeDrafts={canSeeDrafts}
      />

      {ignored.length > 0 && (
        <p role="status" className="text-sm text-muted-foreground">
          Ignored filters that weren&apos;t recognised: {ignored.join(", ")}.
        </p>
      )}

      <div className="flex items-end justify-between gap-4 border-b pb-4">
        <p role="status" className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
          {page.total === 1 ? `1 ${noun}` : `${page.total} ${noun}s`}
          {hasFilters && " match these filters"}
        </p>
        {canSeeDrafts && (
          <Link href="/projects/new" className={buttonVariants()}>
            Add project
          </Link>
        )}
      </div>

      {page.items.length === 0 ? (
        <div className="flex flex-col items-start gap-3 border border-dashed p-10">
          <h2 className="text-2xl">{drafts ? "No drafts" : "No projects found"}</h2>
          <p className="text-soft-foreground">
            {hasFilters
              ? "Nothing matches these filters. Try removing one."
              : drafts
                ? "Nothing is waiting for review."
                : "No approved projects have been added yet."}
          </p>
          {hasFilters && (
            <Link href="/projects" className={buttonVariants({ variant: "outline" })}>
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        // Hairlines drawn per tile (right and bottom edges), so a short last row leaves no grey block.
        <ul className="grid border-t border-l sm:grid-cols-2 lg:grid-cols-3">
          {page.items.map((item) => (
            <li key={item.project.id} className="border-r border-b">
              <ProjectCard item={item} catalog={catalog} />
            </li>
          ))}
        </ul>
      )}

      <Pagination filters={filters} page={page.page} pageCount={page.pageCount} />
    </>
  );
}
