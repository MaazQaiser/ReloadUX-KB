import Link from "next/link";
import { projectSearchHref, type ProjectFilters } from "@/schemas/project-filters";

interface PaginationProps {
  filters: ProjectFilters;
  page: number;
  pageCount: number;
}

export function Pagination({ filters, page, pageCount }: PaginationProps) {
  if (pageCount <= 1) return null;
  const linkClass = "rounded-md border px-3 py-1.5 text-sm hover:bg-muted";
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link href={projectSearchHref(filters, page - 1)} className={linkClass} rel="prev">
          Previous
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </p>
      {page < pageCount ? (
        <Link href={projectSearchHref(filters, page + 1)} className={linkClass} rel="next">
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
