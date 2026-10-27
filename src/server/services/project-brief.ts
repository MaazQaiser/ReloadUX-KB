import "server-only";
import { PROJECT_STATUS } from "@/lib/constants";
import { tagLabel, type CatalogList } from "@/lib/tag-catalog";
import type { Link } from "@/schemas/common";
import type { Person } from "@/schemas/person";
import { getProjectDetail } from "@/server/services/projects";
import { getTagCatalog } from "@/server/services/tags";
import { getProjectGallery } from "@/server/services/visuals";

/** How many screenshots the panel shows; the full gallery is on the project page. */
const BRIEF_SCREENS = 4;

const LINK_GROUPS = [
  ["figma_files", "Figma"],
  ["prototype_url", "Prototype"],
  ["live_url", "Live"],
  ["case_study_url", "Case study"],
] as const;

/**
 * Everything the Ask screen's project panel shows, with tags and people
 * already turned into display names. Facts come straight from the record;
 * missing ones stay undefined so the panel can say "not recorded".
 */
export interface ProjectBrief {
  slug: string;
  name: string;
  client_name?: string;
  country?: string;
  nda: boolean;
  industry: string;
  status: string;
  product_types: string[];
  services: string[];
  ai_features: string[];
  flows: string[];
  business_model: string[];
  personas: string[];
  summary: string;
  what_we_did?: string;
  outcomes?: string;
  lead_designer?: string;
  designers: string[];
  account_manager?: string;
  delivered_to?: string;
  start_date?: Date;
  delivery_date?: Date;
  duration_weeks?: number;
  links: { group: string; link: Link }[];
  screens: { url: string; caption?: string }[];
}

function personName(person: Person | null): string | undefined {
  if (!person) return undefined;
  return person.active ? person.name : `${person.name} (former)`;
}

const labels = (list: CatalogList, keys: readonly string[]) => keys.map((key) => tagLabel(list, key));

export async function getProjectBrief(slug: string): Promise<ProjectBrief | null> {
  const detail = await getProjectDetail(slug);
  if (!detail) return null;
  const { project, people } = detail;
  const [catalog, gallery] = await Promise.all([getTagCatalog(), getProjectGallery(project.id)]);
  const screens = [...gallery.filter((visual) => visual.is_cover), ...gallery.filter((visual) => !visual.is_cover)];

  return {
    slug: project.slug,
    name: project.name,
    client_name: project.client_name,
    country: project.country,
    nda: project.nda,
    industry: tagLabel(catalog.industry, project.industry),
    status: PROJECT_STATUS.labels[project.status],
    product_types: labels(catalog.product_types, project.product_types),
    services: labels(catalog.services, project.services),
    // "none" records that we checked; as a fact about the work it reads as an empty list.
    ai_features: labels(catalog.ai_features, project.ai_features.filter((feature) => feature !== "none")),
    flows: labels(catalog.flows, project.flows),
    business_model: labels(catalog.business_model, project.business_model),
    personas: project.personas,
    summary: project.summary,
    what_we_did: project.what_we_did,
    outcomes: project.outcomes,
    lead_designer: personName(people.lead_designer),
    designers: people.designers.flatMap((person) => personName(person) ?? []),
    account_manager: personName(people.account_manager),
    delivered_to: project.delivered_to && [project.delivered_to.name, project.delivered_to.role].filter(Boolean).join(", "),
    start_date: project.start_date,
    delivery_date: project.delivery_date,
    duration_weeks: project.duration_weeks,
    links: LINK_GROUPS.flatMap(([field, group]) => project[field].map((link) => ({ group, link }))),
    screens: screens.slice(0, BRIEF_SCREENS).map((visual) => ({ url: visual.url, caption: visual.caption })),
  };
}
