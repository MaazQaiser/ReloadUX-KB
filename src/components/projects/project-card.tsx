import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TagBadges } from "@/components/tag-badges";
import { PROJECT_STATUS } from "@/lib/constants";
import { tagLabel, type TagCatalog } from "@/lib/tag-catalog";
import { formatYear } from "@/lib/format";
import type { ProjectGridItem } from "@/server/services/projects";
import { CompletenessBar } from "./completeness-bar";

/** A Pulse soft card: hairline, a whisper of shadow, and a 2px lift on hover. */
export function ProjectCard({ item: { project, leadDesigner, completeness }, catalog }: { item: ProjectGridItem; catalog: TagCatalog }) {
  const aiFeatures = project.ai_features.filter((feature) => feature !== "none");
  const when = project.delivery_date
    ? `Delivered ${formatYear(project.delivery_date)}`
    : PROJECT_STATUS.labels[project.status];

  return (
    <article className="group relative flex h-full flex-col gap-5 rounded-2xl border bg-card p-6 shadow-pulse-soft transition-all duration-300 ease-pulse focus-within:-translate-y-0.5 focus-within:shadow-pulse-soft-lg hover:-translate-y-0.5 hover:shadow-pulse-soft-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs tracking-wide text-pulse-muted uppercase">
          {tagLabel(catalog.industry, project.industry)} · {when}
        </p>
        <div className="flex shrink-0 gap-1">
          {project.review_status === "draft" && <Badge variant="secondary">Draft</Badge>}
          {project.nda && <Badge variant="outline">NDA</Badge>}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg leading-snug font-medium">
          {/* The stretched link makes the whole tile clickable with one tab stop. */}
          <Link
            href={`/projects/${project.slug}`}
            className="after:absolute after:inset-0 after:rounded-2xl focus:outline-none focus-visible:after:ring-4 focus-visible:after:ring-ring/15"
          >
            {project.name}
          </Link>
        </h2>
        <p className="text-sm text-muted-foreground">{project.client_name ?? "Client not recorded"}</p>
      </div>
      <p className="line-clamp-3 text-sm leading-relaxed text-foreground/70">{project.summary}</p>
      <div className="mt-auto flex flex-col gap-2">
        <TagBadges list={catalog.product_types} values={project.product_types} variant="outline" />
        {aiFeatures.length > 0 && <TagBadges list={catalog.ai_features} values={aiFeatures} />}
      </div>
      <div className="flex items-center justify-between gap-4 border-t pt-4 text-sm text-muted-foreground">
        <p>
          Lead <span className="text-foreground">{leadDesigner?.name ?? "not recorded"}</span>
        </p>
        <CompletenessBar completeness={completeness} />
      </div>
    </article>
  );
}
