import { AI_FEATURE, FLOW, INDUSTRY, PRODUCT_TYPE, PROJECT_STATUS, SERVICE, type TagList } from "./constants";
import type { ProjectFields } from "@/schemas/project";

function labels<K extends string>(list: TagList<K>, keys: readonly K[]): string[] {
  return keys.map((key) => list.labels[key]);
}

/**
 * The text keyword search indexes for a project: names, tag labels (what
 * people type, not the stored keys), story fields and people's names.
 * Links and dates are left out; they're matched by filters, not words.
 */
export function buildSearchText(project: ProjectFields, peopleNames: readonly string[]): string {
  const parts = [
    project.name,
    project.client_name,
    project.country,
    INDUSTRY.labels[project.industry],
    PROJECT_STATUS.labels[project.status],
    ...labels(PRODUCT_TYPE, project.product_types),
    ...labels(SERVICE, project.services),
    ...labels(AI_FEATURE, project.ai_features.filter((feature) => feature !== "none")),
    ...labels(FLOW, project.flows),
    ...peopleNames,
    project.delivered_to?.name,
    project.summary,
    project.challenge,
    project.what_we_did,
    project.outcomes,
    project.testimonial,
    ...project.metrics.map((metric) => `${metric.label} ${metric.value}`),
    ...project.milestones.map((milestone) => milestone.name),
    project.public_summary,
  ];
  return parts.filter((part): part is string => Boolean(part?.trim())).join("\n");
}
