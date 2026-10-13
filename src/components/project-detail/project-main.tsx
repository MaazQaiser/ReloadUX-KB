import { Badge } from "@/components/ui/badge";
import { TagBadges } from "@/components/tag-badges";
import { PROJECT_STATUS } from "@/lib/constants";
import { tagLabel, type TagCatalog } from "@/lib/tag-catalog";
import type { Project } from "@/schemas/project";
import { VisualGallery } from "@/components/visuals/visual-gallery";
import type { VisualView } from "@/server/services/visuals";
import { DetailSection, Field, FieldList, NotRecorded } from "./section";

export function ProjectHeader({ project, catalog }: { project: Project; catalog: TagCatalog }) {
  return (
    <header className="flex flex-col gap-4">
      <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
        {tagLabel(catalog.industry, project.industry)} · {PROJECT_STATUS.labels[project.status]}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-4xl leading-tight sm:text-6xl">{project.name}</h1>
        {project.nda && <Badge variant="outline">NDA</Badge>}
      </div>
      <p className="text-lg text-soft-foreground">
        {project.client_name ?? "Client not recorded"}
        {project.country && ` · ${project.country}`}
      </p>
      <TagBadges list={catalog.product_types} values={project.product_types} variant="outline" />
    </header>
  );
}

const STORY_FIELDS = [
  ["challenge", "Challenge"],
  ["what_we_did", "What we did"],
  ["outcomes", "Outcomes"],
  ["testimonial", "Testimonial"],
] as const;

export function ProjectMain({ project, gallery, catalog }: { project: Project; gallery: VisualView[]; catalog: TagCatalog }) {
  const story = STORY_FIELDS.filter(([field]) => project[field]);

  return (
    <div className="flex flex-col gap-8">
      <DetailSection title="Summary">
        <p className="font-heading text-2xl leading-relaxed">{project.summary}</p>
      </DetailSection>

      <DetailSection title="Scope">
        <FieldList>
          <Field label="Services">
            {project.services.length > 0 ? <TagBadges list={catalog.services} values={project.services} /> : null}
          </Field>
          <Field label="AI features">
            {project.ai_features.length > 0 ? <TagBadges list={catalog.ai_features} values={project.ai_features} /> : null}
          </Field>
          <Field label="Flows">
            {project.flows.length > 0 ? <TagBadges list={catalog.flows} values={project.flows} /> : null}
          </Field>
        </FieldList>
      </DetailSection>

      <DetailSection title="Story">
        {story.length === 0 && project.metrics.length === 0 ? (
          <p className="text-sm">
            <NotRecorded />
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {story.map(([field, label]) => (
              <div key={field} className="flex flex-col gap-1">
                <h3 className="text-lg font-medium">{label}</h3>
                <p className="leading-relaxed text-soft-foreground">{project[field]}</p>
              </div>
            ))}
            {project.metrics.length > 0 && (
              <ul className="grid grid-cols-2 border-t border-l sm:grid-cols-3">
                {project.metrics.map((metric) => (
                  <li key={metric.label} className="border-r border-b p-5">
                    <p className="font-heading text-4xl">{metric.value}</p>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </DetailSection>

      <DetailSection title="Client-safe summary">
        <p className="text-sm text-muted-foreground">Use this text in proposals, especially for NDA projects.</p>
        {project.public_summary ? <p className="leading-relaxed">{project.public_summary}</p> : <NotRecorded />}
      </DetailSection>

      <DetailSection title="Visuals">
        {gallery.length > 0 ? (
          <VisualGallery visuals={gallery} projectName={project.name} flows={catalog.flows} />
        ) : (
          <p className="text-sm text-muted-foreground">No screenshots yet.</p>
        )}
      </DetailSection>
    </div>
  );
}
