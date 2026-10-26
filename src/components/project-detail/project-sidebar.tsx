import type { Link as ProjectLink } from "@/schemas/common";
import type { Person } from "@/schemas/person";
import type { ProjectDetail } from "@/server/services/projects";
import { formatDate, formatWeeks } from "@/lib/format";
import { CompletenessMeter } from "./completeness-meter";
import { DetailSection, Field, FieldList, NotRecorded } from "./section";

function personName(person: Person | null) {
  if (!person) return null;
  return person.active ? person.name : `${person.name} (former)`;
}

const LINK_GROUPS = [
  ["figma_files", "Figma"],
  ["prototype_url", "Prototype"],
  ["live_url", "Live"],
  ["case_study_url", "Case study"],
  ["drive_folder", "Drive"],
] as const;

function LinkList({ links }: { links: ProjectLink[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {links.map((link) => (
        <li key={link.url}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-border underline-offset-4 transition-colors duration-300 hover:decoration-foreground/40"
          >
            {link.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function ProjectSidebar({ detail: { project, people, completeness } }: { detail: ProjectDetail }) {
  const linkGroups = LINK_GROUPS.filter(([field]) => project[field].length > 0);

  return (
    <aside className="flex min-w-0 flex-col gap-10">
      <CompletenessMeter completeness={completeness} />

      <DetailSection title="People">
        <FieldList>
          <Field label="Lead designer">{personName(people.lead_designer)}</Field>
          <Field label="Designers">
            {people.designers.length > 0 ? people.designers.map(personName).join(", ") : null}
          </Field>
          <Field label="Account manager">{personName(people.account_manager)}</Field>
          <Field label="Delivered to">
            {project.delivered_to &&
              [project.delivered_to.name, project.delivered_to.role].filter(Boolean).join(", ")}
          </Field>
        </FieldList>
      </DetailSection>

      <DetailSection title="Timeline">
        <FieldList>
          <Field label="Started">{project.start_date && formatDate(project.start_date)}</Field>
          <Field label="Delivered">{project.delivery_date && formatDate(project.delivery_date)}</Field>
          <Field label="Duration">{project.duration_weeks && formatWeeks(project.duration_weeks)}</Field>
        </FieldList>
        {project.milestones.length > 0 && (
          <ol className="flex flex-col gap-1.5 border-l-[3px] border-pulse-rule pl-4 text-[13px]">
            {project.milestones.map((milestone) => (
              <li key={`${milestone.name}-${milestone.date.toISOString()}`}>
                <span className="text-pulse-tertiary tabular-nums">{formatDate(milestone.date)}</span> · {milestone.name}
              </li>
            ))}
          </ol>
        )}
      </DetailSection>

      <DetailSection title="Links">
        {linkGroups.length === 0 ? (
          <p className="text-sm">
            <NotRecorded />
          </p>
        ) : (
          <FieldList>
            {linkGroups.map(([field, label]) => (
              <Field key={field} label={label}>
                <LinkList links={project[field]} />
              </Field>
            ))}
          </FieldList>
        )}
      </DetailSection>
    </aside>
  );
}
