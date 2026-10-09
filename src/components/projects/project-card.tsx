import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagBadges } from "@/components/tag-badges";
import { AI_FEATURE, INDUSTRY, PRODUCT_TYPE, PROJECT_STATUS } from "@/lib/constants";
import { formatYear } from "@/lib/format";
import type { ProjectGridItem } from "@/server/services/projects";

export function ProjectCard({ item: { project, leadDesigner } }: { item: ProjectGridItem }) {
  const aiFeatures = project.ai_features.filter((feature) => feature !== "none");
  const when = project.delivery_date
    ? `delivered ${formatYear(project.delivery_date)}`
    : PROJECT_STATUS.labels[project.status];

  return (
    <Card className="relative h-full transition-shadow focus-within:ring-2 focus-within:ring-ring hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>
            {/* The stretched link makes the whole card clickable with one tab stop. */}
            <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0 focus:outline-none">
              {project.name}
            </Link>
          </CardTitle>
          {project.nda && <Badge variant="outline">NDA</Badge>}
        </div>
        <p className="text-muted-foreground">{project.client_name ?? "Client not recorded"}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="line-clamp-2 text-muted-foreground">{project.summary}</p>
        <TagBadges list={PRODUCT_TYPE} values={project.product_types} />
        {aiFeatures.length > 0 && <TagBadges list={AI_FEATURE} values={aiFeatures} variant="outline" />}
        <dl className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
          <div className="flex gap-1">
            <dt className="sr-only">Industry</dt>
            <dd>{INDUSTRY.labels[project.industry]}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="sr-only">Timeline</dt>
            <dd>{when}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Lead</dt>
            <dd className="text-foreground">{leadDesigner?.name ?? "not recorded"}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
