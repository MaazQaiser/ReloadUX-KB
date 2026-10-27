import "server-only";
import { PROJECT_STATUS } from "@/lib/constants";
import { tagLabel, type CatalogList, type TagCatalog } from "@/lib/tag-catalog";
import type { Project } from "@/schemas/project";
import type { Person } from "@/schemas/person";
import type { ProjectDetail } from "@/server/services/projects";

const labels = (list: CatalogList, keys: readonly string[]) => keys.map((key) => tagLabel(list, key));
const day = (date?: Date) => date?.toISOString().slice(0, 10);

function personName(person: Person | null): string | undefined {
  if (!person) return undefined;
  return person.active ? person.name : `${person.name} (no longer at reloadux)`;
}

/** A project in a list: enough to judge a match and to cite it, without the long story fields. */
export function projectSummary(project: Project, catalog: TagCatalog) {
  return {
    slug: project.slug,
    name: project.name,
    client: project.client_name ?? null,
    nda: project.nda,
    industry: tagLabel(catalog.industry, project.industry),
    status: PROJECT_STATUS.labels[project.status],
    product_types: labels(catalog.product_types, project.product_types),
    ai_features: labels(catalog.ai_features, project.ai_features),
    flows: labels(catalog.flows, project.flows),
    business_model: labels(catalog.business_model, project.business_model),
    delivered: day(project.delivery_date) ?? null,
    summary: project.summary,
  };
}

/** Everything recorded about one project. Missing values are null so the agent says "not recorded". */
export function projectRecord({ project, people }: ProjectDetail, catalog: TagCatalog) {
  return {
    ...projectSummary(project, catalog),
    country: project.country ?? null,
    services: labels(catalog.services, project.services),
    personas: project.personas,
    lead_designer: personName(people.lead_designer) ?? null,
    designers: people.designers.flatMap((person) => personName(person) ?? []),
    account_manager: personName(people.account_manager) ?? null,
    delivered_to: project.delivered_to ? [project.delivered_to.name, project.delivered_to.role].filter(Boolean).join(", ") : null,
    start_date: day(project.start_date) ?? null,
    delivery_date: day(project.delivery_date) ?? null,
    duration_weeks: project.duration_weeks ?? null,
    milestones: project.milestones.map((milestone) => ({ name: milestone.name, date: day(milestone.date) })),
    links: {
      figma: project.figma_files,
      prototype: project.prototype_url,
      live: project.live_url,
      case_study: project.case_study_url,
      drive: project.drive_folder,
    },
    challenge: project.challenge ?? null,
    what_we_did: project.what_we_did ?? null,
    outcomes: project.outcomes ?? null,
    testimonial: project.testimonial ?? null,
    metrics: project.metrics,
    client_safe_summary: project.public_summary ?? null,
    screenshots: project.visuals.length,
  };
}
