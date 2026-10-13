import { PROJECT_STATUS } from "./constants";
import { tagLabel, type CatalogList, type TagCatalog } from "./tag-catalog";
import type { ProjectFields } from "@/schemas/project";

const labels = (list: CatalogList, keys: readonly string[]) => keys.map((key) => tagLabel(list, key));

/**
 * The text keyword search indexes for a project: names, tag labels (what
 * people type, not the stored keys), story fields and people's names.
 * Links and dates are left out; they're matched by filters, not words.
 */
export function buildSearchText(project: ProjectFields, peopleNames: readonly string[], catalog: TagCatalog): string {
  const parts = [
    project.name,
    project.client_name,
    project.country,
    tagLabel(catalog.industry, project.industry),
    PROJECT_STATUS.labels[project.status],
    ...labels(catalog.product_types, project.product_types),
    ...labels(catalog.services, project.services),
    ...labels(catalog.ai_features, project.ai_features.filter((feature) => feature !== "none")),
    ...labels(catalog.flows, project.flows),
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
