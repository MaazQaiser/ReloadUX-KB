import { PROJECT_STATUS } from "./constants";
import { tagLabel, type CatalogList, type TagCatalog } from "./tag-catalog";
import type { ProjectFields } from "@/schemas/project";

/** Which part of the record a chunk came from; "profile" is the whole project in brief. */
export type ChunkField = "profile" | "challenge" | "what_we_did" | "outcomes" | "testimonial";

export interface ProjectChunk {
  field: ChunkField;
  /** Position within the field, from 0, for fields split into several chunks. */
  ordinal: number;
  text: string;
}

const STORY_FIELDS = [
  ["challenge", "Challenge"],
  ["what_we_did", "What we did"],
  ["outcomes", "Outcomes"],
  ["testimonial", "Testimonial"],
] as const;

const labels = (list: CatalogList, keys: readonly string[]) => keys.map((key) => tagLabel(list, key)).join(", ");

/** The project in a paragraph: what a "have we done X?" question is usually matched against. */
function profileText(project: ProjectFields, catalog: TagCatalog): string {
  const aiFeatures = project.ai_features.filter((feature) => feature !== "none");
  const lines = [
    `${project.name}${project.client_name ? ` for ${project.client_name}` : ""}`,
    `Industry: ${tagLabel(catalog.industry, project.industry)}. Status: ${PROJECT_STATUS.labels[project.status]}.`,
    `Type: ${labels(catalog.product_types, project.product_types)}.`,
    project.services.length > 0 ? `Services: ${labels(catalog.services, project.services)}.` : "",
    aiFeatures.length > 0 ? `AI features: ${labels(catalog.ai_features, aiFeatures)}.` : "",
    project.flows.length > 0 ? `Flows: ${labels(catalog.flows, project.flows)}.` : "",
    project.business_model.length > 0 ? `Business model: ${labels(catalog.business_model, project.business_model)}.` : "",
    project.personas.length > 0 ? `Personas: ${project.personas.join("; ")}.` : "",
    project.summary,
  ];
  return lines.filter(Boolean).join("\n");
}

/** Splits at paragraph, then sentence, boundaries so no chunk passes `maxChars`. */
export function splitText(text: string, maxChars: number): string[] {
  const pieces = text
    .split(/\n{2,}/)
    .flatMap((paragraph) => (paragraph.length <= maxChars ? [paragraph] : (paragraph.match(/[^.!?]+[.!?]*\s*/g) ?? [paragraph])))
    .flatMap((piece) => {
      // A single sentence longer than the limit is cut on whitespace as a last resort.
      if (piece.length <= maxChars) return [piece];
      const words = piece.split(/\s+/);
      const parts: string[] = [];
      let current = "";
      for (const word of words) {
        if (current && current.length + word.length + 1 > maxChars) {
          parts.push(current);
          current = word;
        } else current = current ? `${current} ${word}` : word;
      }
      return current ? [...parts, current] : parts;
    })
    .map((piece) => piece.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const piece of pieces) {
    const last = chunks.at(-1);
    if (last !== undefined && last.length + piece.length + 1 <= maxChars) chunks[chunks.length - 1] = `${last} ${piece}`;
    else chunks.push(piece);
  }
  return chunks;
}

/**
 * The texts embedded for a project: one profile chunk, then the long story
 * fields split to fit. Each story chunk is prefixed with the project name and
 * field so it still makes sense when it's found on its own.
 */
export function buildProjectChunks(project: ProjectFields, catalog: TagCatalog, maxChars: number): ProjectChunk[] {
  const chunks: ProjectChunk[] = splitText(profileText(project, catalog), maxChars).map((text, ordinal) => ({
    field: "profile",
    ordinal,
    text,
  }));
  for (const [field, label] of STORY_FIELDS) {
    const value = project[field];
    if (!value) continue;
    const prefix = `${project.name}, ${label}: `;
    splitText(value, maxChars - prefix.length).forEach((text, ordinal) => chunks.push({ field, ordinal, text: prefix + text }));
  }
  return chunks;
}
