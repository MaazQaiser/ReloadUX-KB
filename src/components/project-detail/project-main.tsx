import { Badge } from "@/components/ui/badge";
import { TagBadges } from "@/components/tag-badges";
import { PROJECT_STATUS } from "@/lib/constants";
import { tagLabel, type TagCatalog } from "@/lib/tag-catalog";
import type { Project } from "@/schemas/project";
import { VisualGallery } from "@/components/visuals/visual-gallery";
import type { VisualView } from "@/server/services/visuals";
import { cn } from "@/lib/utils";
import { DetailSection, Field, FieldList, NotRecorded, ReportEyebrow } from "./section";

export function ProjectHeader({ project, catalog }: { project: Project; catalog: TagCatalog }) {
  return (
    <header className="flex flex-col gap-4">
      <ReportEyebrow>
        {tagLabel(catalog.industry, project.industry)} · {PROJECT_STATUS.labels[project.status]}
      </ReportEyebrow>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-4xl leading-[1.02] font-bold tracking-[-0.02em] break-words sm:text-5xl">
          {project.name}
        </h1>
        {project.nda && <Badge variant="outline">NDA</Badge>}
      </div>
      <p className="text-sm text-pulse-secondary">
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
    <div className="flex min-w-0 flex-col gap-12">
      <DetailSection title="Summary" level="section">
        <p className="text-base leading-[1.65]">{project.summary}</p>
      </DetailSection>

      <DetailSection title="Scope" level="topic">
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
          <Field label="Business model">
            {project.business_model.length > 0 ? <TagBadges list={catalog.business_model} values={project.business_model} /> : null}
          </Field>
          <Field label="Personas">
            {project.personas.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {project.personas.map((persona) => (
                  <li key={persona}>{persona}</li>
                ))}
              </ul>
            ) : null}
          </Field>
        </FieldList>
      </DetailSection>

      <DetailSection title="Story" level="topic">
        {story.length === 0 && project.metrics.length === 0 ? (
          <p className="text-sm">
            <NotRecorded />
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {project.metrics.length > 0 && (
              // Pulse's stat row: serif numerals between rules, the first in violet. The 1px gap over
              // a rule-coloured background draws the dividers, so they never double up when rows wrap.
              <ul className="grid grid-cols-2 gap-px border-y border-pulse-rule bg-pulse-rule sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none">
                {project.metrics.map((metric, index) => (
                  <li key={metric.label} className="bg-background px-3 pt-5 pb-4">
                    <p
                      className={cn(
                        "font-heading text-[40px] leading-none font-bold tracking-[-0.02em] tabular-nums sm:text-[46px]",
                        index === 0 && "text-pulse-accent",
                      )}
                    >
                      {metric.value}
                    </p>
                    <p className="mt-2 text-[11.5px] text-pulse-secondary">{metric.label}</p>
                  </li>
                ))}
              </ul>
            )}
            {story.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="rx-table-head">
                    <tr>
                      <th scope="col" className="w-[32%] px-4 py-3 text-left text-[10px] font-bold tracking-[0.1em] text-white uppercase">
                        Part
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold tracking-[0.1em] text-white uppercase">
                        What happened
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {story.map(([field, label]) => (
                      <tr key={field}>
                        <th scope="row" className="border-b border-pulse-rule px-4 py-3.5 text-left align-top text-[13px] font-bold">
                          {label}
                        </th>
                        <td className="border-b border-pulse-rule px-4 py-3.5 align-top text-[13px] leading-[1.5] whitespace-pre-line text-pulse-secondary">
                          {project[field]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </DetailSection>

      {/* Pulse's scope callout: the one block meant to be lifted out and reused. */}
      <section
        aria-labelledby="section-client-safe-summary"
        className="flex flex-col gap-2.5 border-l-[3px] border-(--pulse-border-accent) bg-pulse-fill px-6 py-5"
      >
        <h2 id="section-client-safe-summary" className="text-[11px] font-bold tracking-[0.12em] text-pulse-accent uppercase">
          Client-safe summary
        </h2>
        <p className="text-[13px] leading-[1.6] text-pulse-secondary">Use this text in proposals, especially for NDA projects.</p>
        {project.public_summary ? (
          <p className="text-sm leading-[1.65] text-foreground">{project.public_summary}</p>
        ) : (
          <NotRecorded />
        )}
      </section>

      <DetailSection title="Visuals" level="topic">
        {gallery.length > 0 ? (
          <VisualGallery visuals={gallery} projectName={project.name} flows={catalog.flows} />
        ) : (
          <p className="text-sm text-pulse-secondary">No screenshots yet.</p>
        )}
      </DetailSection>
    </div>
  );
}
