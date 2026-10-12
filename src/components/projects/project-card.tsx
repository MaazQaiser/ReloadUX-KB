import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TagBadges } from "@/components/tag-badges";
import { AI_FEATURE, INDUSTRY, PRODUCT_TYPE, PROJECT_STATUS } from "@/lib/constants";
import { formatYear } from "@/lib/format";
import type { ProjectGridItem } from "@/server/services/projects";

/** A tile in the hairline grid, like the work grid on reloadux.com. */
export function ProjectCard({ item: { project, leadDesigner } }: { item: ProjectGridItem }) {
  const aiFeatures = project.ai_features.filter((feature) => feature !== "none");
  const when = project.delivery_date
    ? `Delivered ${formatYear(project.delivery_date)}`
    : PROJECT_STATUS.labels[project.status];

  return (
    <article className="group relative flex h-full flex-col gap-5 bg-background p-6 transition-colors focus-within:bg-card hover:bg-card sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
          {INDUSTRY.labels[project.industry]} · {when}
        </p>
        {project.nda && <Badge variant="outline">NDA</Badge>}
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl leading-snug">
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
        <TagBadges list={PRODUCT_TYPE} values={project.product_types} variant="outline" />
        {aiFeatures.length > 0 && <TagBadges list={AI_FEATURE} values={aiFeatures} />}
      </div>
      <p className="border-t pt-4 text-sm text-muted-foreground">
        Lead <span className="text-foreground">{leadDesigner?.name ?? "not recorded"}</span>
      </p>
    </article>
  );
}
