import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Pagination } from "@/components/projects/pagination";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFiltersBar } from "@/components/projects/project-filters";
import { ProjectsSkeleton } from "@/components/projects/projects-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { hasRole } from "@/lib/auth-rules";
import { parseProjectSearch, type RawSearchParams } from "@/schemas/project-filters";
import { requireRole } from "@/server/auth";
import { getGridFilterOptions, listProjectsForGrid } from "@/server/services/projects";
import { getTagCatalog } from "@/server/services/tags";

export const metadata: Metadata = { title: "projects" };

export default function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <ProjectsView searchParams={searchParams} />
    </Suspense>
  );
}

async function ProjectsView({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requireRole("viewer");
  const { filters, pagination, ignored } = parseProjectSearch(await searchParams);
  const [page, options, catalog] = await Promise.all([
    listProjectsForGrid(filters, pagination),
    getGridFilterOptions(),
    getTagCatalog(),
  ]);
  // Sort changes the order, not which projects match, so it doesn't count as a filter.
  const hasFilters = Object.entries(filters).some(([key, value]) => value !== undefined && key !== "sort");

  return (
    <>
      <ProjectFiltersBar filters={filters} options={options} catalog={catalog} canAdd={hasRole(user.role, "editor")} />

      {ignored.length > 0 && (
        <p role="status" className="text-sm text-muted-foreground">
          Ignored filters that weren&apos;t recognised: {ignored.join(", ")}.
        </p>
      )}

      <div className="flex items-baseline justify-between gap-4 border-b pb-4">
        <p role="status" className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
          {page.total === 1 ? "1 project" : `${page.total} projects`}
          {hasFilters && " match these filters"}
        </p>
        {hasFilters && (
          <Link href="/projects" className="text-sm text-soft-foreground underline-offset-4 hover:underline">
            Clear all
          </Link>
        )}
      </div>

      {page.items.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rx-corner-glow border border-white/10 p-10">
          <h2 className="text-2xl">No projects found</h2>
          <p className="text-soft-foreground">
            {hasFilters ? "Nothing matches these filters. Try removing one." : "No approved projects have been added yet."}
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
