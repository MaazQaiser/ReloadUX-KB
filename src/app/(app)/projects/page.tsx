import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Pagination } from "@/components/projects/pagination";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFiltersForm } from "@/components/projects/project-filters";
import { ProjectsSkeleton } from "@/components/projects/projects-skeleton";
import { parseProjectSearch, type RawSearchParams } from "@/schemas/project-filters";
import { requireRole } from "@/server/auth";
import { getGridFilterOptions, listProjectsForGrid } from "@/server/services/projects";

export const metadata: Metadata = { title: "projects" };

export default function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">projects</h1>
        <p className="text-muted-foreground">Every approved project, newest delivery first.</p>
      </div>
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsView searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProjectsView({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireRole("viewer");
  const { filters, pagination, ignored } = parseProjectSearch(await searchParams);
  const [page, options] = await Promise.all([listProjectsForGrid(filters, pagination), getGridFilterOptions()]);
  const hasFilters = Object.values(filters).some((value) => value !== undefined);

  return (
    <>
      {/* Keyed on the filters so the inputs reset to the URL after each navigation. */}
      <ProjectFiltersForm key={JSON.stringify(filters)} filters={filters} options={options} />

      {ignored.length > 0 && (
        <p role="status" className="text-sm text-muted-foreground">
          Ignored filters that weren&apos;t recognised: {ignored.join(", ")}.
        </p>
      )}

      <p role="status" className="text-sm text-muted-foreground">
        {page.total === 1 ? "1 project" : `${page.total} projects`}
        {hasFilters && " match these filters"}
      </p>

      {page.items.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed p-8">
          <h2 className="font-medium">No projects found</h2>
          <p className="text-muted-foreground">
            {hasFilters ? "Nothing matches these filters. Try removing one." : "No approved projects have been added yet."}
          </p>
          {hasFilters && (
            <Link href="/projects" className="text-sm underline underline-offset-4">
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {page.items.map((item) => (
            <li key={item.project.id}>
              <ProjectCard item={item} />
            </li>
          ))}
        </ul>
      )}

      <Pagination filters={filters} page={page.page} pageCount={page.pageCount} />
    </>
  );
}
