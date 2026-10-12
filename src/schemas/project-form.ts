import { z } from "zod";
import {
  aiFeatureSchema,
  flowSchema,
  industrySchema,
  productTypeSchema,
  projectStatusSchema,
  serviceSchema,
} from "./tags";

/**
 * What the project form holds while someone types: strings for every input,
 * "" for empty. Server actions check this shape before converting it into a
 * project input, which is then validated again by the save service.
 */
const text = (max: number) => z.string().max(max);
const rows = <T extends z.ZodType>(row: T) => z.array(row).max(50);
const linkRows = rows(z.object({ label: text(200), url: text(2000) }));

export const projectFormValuesSchema = z.object({
  name: text(200),
  client_name: text(200),
  industry: industrySchema.or(z.literal("")),
  country: text(200),
  status: projectStatusSchema.or(z.literal("")),
  nda: z.boolean(),

  product_types: z.array(productTypeSchema).max(20),
  services: z.array(serviceSchema).max(20),
  ai_features: z.array(aiFeatureSchema).max(20),
  flows: z.array(flowSchema).max(20),

  lead_designer: text(24),
  designers: z.array(text(24)).max(50),
  account_manager: text(24),
  delivered_to_name: text(200),
  delivered_to_role: text(200),

  start_date: text(10),
  delivery_date: text(10),
  duration_weeks: text(10),
  milestones: rows(z.object({ name: text(200), date: text(10) })),

  figma_files: linkRows,
  prototype_url: linkRows,
  live_url: linkRows,
  case_study_url: linkRows,
  drive_folder: linkRows,

  summary: text(20_000),
  challenge: text(20_000),
  what_we_did: text(20_000),
  outcomes: text(20_000),
  testimonial: text(20_000),
  metrics: rows(z.object({ label: text(200), value: text(200) })),

  public_summary: text(20_000),
});

export type ProjectFormValues = z.infer<typeof projectFormValuesSchema>;
export type LinkField = "figma_files" | "prototype_url" | "live_url" | "case_study_url" | "drive_folder";
