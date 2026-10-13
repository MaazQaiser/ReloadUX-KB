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
    <nav aria-label="Layout" className="flex border border-white/15">
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
              "grid size-9 place-items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
              active && "bg-foreground text-background hover:text-background",
            )}
          >
            <Icon aria-hidden className="size-4" />
          </Link>
        );
      })}
    </nav>
  );
}
