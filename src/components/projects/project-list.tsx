import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PROJECT_STATUS } from "@/lib/constants";
import { formatYear } from "@/lib/format";
import { tagLabel, type TagCatalog } from "@/lib/tag-catalog";
import type { ProjectGridItem } from "@/server/services/projects";
import { CompletenessBar } from "./completeness-bar";

const HEAD = "py-3 pr-4 text-left text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase";
const CELL = "py-4 pr-4 align-middle";

/**
 * The same projects as the grid, one row each, for scanning many at once.
 * Columns drop away on narrow screens; the name and completeness always stay.
 */
export function ProjectList({ items, catalog }: { items: ProjectGridItem[]; catalog: TagCatalog }) {
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">Projects</caption>
      <thead className="border-b">
        <tr>
          <th scope="col" className={HEAD}>Project</th>
          <th scope="col" className={`${HEAD} hidden md:table-cell`}>Industry</th>
          <th scope="col" className={`${HEAD} hidden lg:table-cell`}>Type</th>
          <th scope="col" className={`${HEAD} hidden md:table-cell`}>Lead</th>
          <th scope="col" className={`${HEAD} hidden sm:table-cell`}>Delivered</th>
          <th scope="col" className={`${HEAD} pr-0 text-right`}>Complete</th>
        </tr>
      </thead>
      <tbody>
        {items.map(({ project, leadDesigner, completeness }) => {
          const [firstType, ...otherTypes] = project.product_types;
          return (
            // The stretched link in the name cell makes the whole row clickable with one tab stop.
            <tr key={project.id} className="group relative border-b transition-colors focus-within:bg-white/[0.03] hover:bg-white/[0.03]">
              <td className={CELL}>
                <div className="flex flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/projects/${project.slug}`}
                      className="font-heading text-lg leading-snug after:absolute after:inset-0 focus:outline-none group-hover:underline group-hover:underline-offset-4"
                    >
                      {project.name}
                    </Link>
                    {project.review_status === "draft" && <Badge variant="secondary">Draft</Badge>}
                    {project.nda && <Badge variant="outline">NDA</Badge>}
                  </div>
                  <span className="text-muted-foreground">{project.client_name ?? "Client not recorded"}</span>
                </div>
              </td>
              <td className={`${CELL} hidden text-soft-foreground md:table-cell`}>{tagLabel(catalog.industry, project.industry)}</td>
              <td className={`${CELL} hidden text-soft-foreground lg:table-cell`}>
                {firstType ? tagLabel(catalog.product_types, firstType) : "—"}
                {otherTypes.length > 0 && <span className="text-muted-foreground"> +{otherTypes.length}</span>}
              </td>
              <td className={`${CELL} hidden md:table-cell`}>{leadDesigner?.name ?? <span className="text-muted-foreground">Not recorded</span>}</td>
              <td className={`${CELL} hidden text-soft-foreground tabular-nums sm:table-cell`}>
                {project.delivery_date ? formatYear(project.delivery_date) : PROJECT_STATUS.labels[project.status]}
              </td>
              <td className={`${CELL} pr-0`}>
                <div className="flex justify-end">
                  <CompletenessBar completeness={completeness} />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
