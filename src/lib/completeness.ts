import type { Project } from "@/schemas/project";

/**
 * Optional fields that count towards completeness, in the order the form shows
 * them. Required fields always pass validation, so counting them would only
 * inflate every score. `nda` is excluded because false is a real answer.
 * Every field weighs the same; change the weighting here if that stops fitting.
 */
export const COMPLETENESS_FIELDS = [
  "client_name",
  "country",
  "services",
  "ai_features",
  "flows",
  "designers",
  "account_manager",
  "delivered_to",
  "start_date",
  "delivery_date",
  "duration_weeks",
  "milestones",
  "figma_files",
  "prototype_url",
  "live_url",
  "case_study_url",
  "drive_folder",
  "visuals",
  "challenge",
  "what_we_did",
  "outcomes",
  "testimonial",
  "metrics",
  "public_summary",
] as const satisfies readonly (keyof Project)[];

export type CompletenessField = (typeof COMPLETENESS_FIELDS)[number];

export interface Completeness {
  /** Whole percent, 0 to 100. */
  score: number;
  filled: number;
  total: number;
  missing: CompletenessField[];
}

function isFilled(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim() !== "";
  return true;
}

export function getCompleteness(project: Pick<Project, CompletenessField>): Completeness {
  const missing = COMPLETENESS_FIELDS.filter((field) => !isFilled(project[field]));
  const total = COMPLETENESS_FIELDS.length;
  const filled = total - missing.length;
  return { score: Math.round((filled / total) * 100), filled, total, missing };
}
