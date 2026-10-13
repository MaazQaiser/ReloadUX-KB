import { Badge } from "@/components/ui/badge";
import { TagBadges } from "@/components/tag-badges";
import { AI_FEATURE, FLOW, INDUSTRY, PRODUCT_TYPE, PROJECT_STATUS, SERVICE } from "@/lib/constants";
import type { Project } from "@/schemas/project";
import { VisualGallery } from "@/components/visuals/visual-gallery";
import type { VisualView } from "@/server/services/visuals";
import { DetailSection, Field, FieldList, NotRecorded } from "./section";

export function ProjectHeader({ project }: { project: Project }) {
  return (
    <header className="flex flex-col gap-4">
      <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
        {INDUSTRY.labels[project.industry]} · {PROJECT_STATUS.labels[project.status]}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-4xl leading-tight sm:text-6xl">{project.name}</h1>
        {project.nda && <Badge variant="outline">NDA</Badge>}
      </div>
      <p className="text-lg text-soft-foreground">
        {project.client_name ?? "Client not recorded"}
        {project.country && ` · ${project.country}`}
      </p>
      <TagBadges list={PRODUCT_TYPE} values={project.product_types} variant="outline" />
    </header>
  );
}

const STORY_FIELDS = [
  ["challenge", "Challenge"],
  ["what_we_did", "What we did"],
  ["outcomes", "Outcomes"],
  ["testimonial", "Testimonial"],
] as const;

export function ProjectMain({ project, gallery }: { project: Project; gallery: VisualView[] }) {
  const story = STORY_FIELDS.filter(([field]) => project[field]);

  return (
    <div className="flex flex-col gap-8">
      <DetailSection title="Summary">
        <p className="font-heading text-2xl leading-relaxed">{project.summary}</p>
      </DetailSection>

      <DetailSection title="Scope">
        <FieldList>
          <Field label="Services">
            {project.services.length > 0 ? <TagBadges list={SERVICE} values={project.services} /> : null}
          </Field>
          <Field label="AI features">
            {project.ai_features.length > 0 ? <TagBadges list={AI_FEATURE} values={project.ai_features} /> : null}
          </Field>
          <Field label="Flows">
            {project.flows.length > 0 ? <TagBadges list={FLOW} values={project.flows} /> : null}
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
          <VisualGallery visuals={gallery} projectName={project.name} />
        ) : (
          <p className="text-sm text-muted-foreground">No screenshots yet.</p>
        )}
      </DetailSection>
    </div>
  );
}
