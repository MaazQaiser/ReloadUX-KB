import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TagBadges } from "@/components/tag-badges";
import { PROJECT_STATUS } from "@/lib/constants";
import { tagLabel, type TagCatalog } from "@/lib/tag-catalog";
import { formatYear } from "@/lib/format";
import type { ProjectGridItem } from "@/server/services/projects";

/** A tile in the hairline grid, like the work grid on reloadux.com. */
export function ProjectCard({ item: { project, leadDesigner, completeness }, catalog }: { item: ProjectGridItem; catalog: TagCatalog }) {
  const aiFeatures = project.ai_features.filter((feature) => feature !== "none");
  const when = project.delivery_date
    ? `Delivered ${formatYear(project.delivery_date)}`
    : PROJECT_STATUS.labels[project.status];

  return (
    <article className="group rx-hover-wash flex h-full flex-col gap-5 bg-background p-6 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
          {tagLabel(catalog.industry, project.industry)} · {when}
        </p>
        <div className="flex shrink-0 gap-1">
          {project.review_status === "draft" && <Badge variant="secondary">Draft</Badge>}
          {project.nda && <Badge variant="outline">NDA</Badge>}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl leading-snug font-normal">
          {/* The stretched link makes the whole tile clickable with one tab stop. */}
          <Link
            href={`/projects/${project.slug}`}
            className="after:absolute after:inset-0 focus:outline-none group-hover:underline group-hover:underline-offset-4"
          >
            {project.name}
          </Link>
        </h2>
        <p className="text-sm text-muted-foreground">{project.client_name ?? "Client not recorded"}</p>
      </div>
      <p className="line-clamp-3 text-soft-foreground">{project.summary}</p>
      <div className="mt-auto flex flex-col gap-2">
        <TagBadges list={catalog.product_types} values={project.product_types} variant="outline" />
        {aiFeatures.length > 0 && <TagBadges list={catalog.ai_features} values={aiFeatures} />}
      </div>
      <div className="flex items-center justify-between gap-4 border-t pt-4 text-sm text-muted-foreground">
        <p>
          Lead <span className="text-foreground">{leadDesigner?.name ?? "not recorded"}</span>
        </p>
        <div className="flex items-center gap-2">
          <div
            role="meter"
            aria-label="Record completeness"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completeness.score}
            className="h-1 w-12 overflow-hidden bg-muted"
          >
            <div className="h-full bg-primary" style={{ width: `${completeness.score}%` }} />
          </div>
          <span className="tabular-nums">{completeness.score}%</span>
        </div>
      </div>
    </article>
  );
}
