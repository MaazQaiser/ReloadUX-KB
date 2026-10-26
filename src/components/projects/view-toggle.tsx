import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { projectSearchHref, type ProjectFilters, type ProjectView } from "@/schemas/project-filters";

const VIEWS: { view: ProjectView; label: string; Icon: typeof List }[] = [
  { view: "grid", label: "Grid view", Icon: LayoutGrid },
  { view: "list", label: "List view", Icon: List },
];

/** Grid or list, as links so the choice stays in the URL with the filters and page. */
export function ViewToggle({ filters, page }: { filters: ProjectFilters; page: number }) {
  const current = filters.view ?? "grid";
  return (
    <nav aria-label="Layout" className="flex gap-0.5 rounded-full border p-0.5">
      {VIEWS.map(({ view, label, Icon }) => {
        const active = view === current;
        return (
          <Link
            key={view}
            href={projectSearchHref({ ...filters, view: view === "grid" ? undefined : view }, page)}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            scroll={false}
            className={cn(
              "grid size-8 place-items-center rounded-full text-foreground/60 transition-colors duration-300 outline-none hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/15",
              active && "bg-primary text-primary-foreground shadow-pulse-soft hover:text-primary-foreground",
            )}
          >
            <Icon aria-hidden className="size-4" />
          </Link>
        );
      })}
    </nav>
  );
}
