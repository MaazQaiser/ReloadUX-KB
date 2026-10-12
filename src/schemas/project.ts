import { z } from "zod";
import {
  actorSchema,
  idSchema,
  linkSchema,
  longTextSchema,
  metricSchema,
  milestoneSchema,
  shortTextSchema,
  slugSchema,
} from "./common";
import {
  aiFeaturesSchema,
  flowsSchema,
  industrySchema,
  productTypesSchema,
  projectStatusSchema,
  reviewStatusSchema,
  servicesSchema,
} from "./tags";

const idListSchema = z.array(idSchema).refine((ids) => new Set(ids).size === ids.length, "must not repeat people");
const linksSchema = z.array(linkSchema).default([]);

/**
 * The project data model from SPEC.md. Required: name, industry,
 * product_types, status, lead_designer, summary (plus slug, for matching).
 * Everything else is optional and feeds the completeness score.
 */
export const projectInputSchema = z
  .object({
    // Basics
    name: shortTextSchema,
    slug: slugSchema,
    client_name: shortTextSchema.optional(),
    industry: industrySchema,
    country: shortTextSchema.optional(),
    status: projectStatusSchema,
    nda: z.boolean().default(false),

    // Type and scope
    product_types: productTypesSchema.min(1, "pick at least one product type"),
    services: servicesSchema.default([]),
    ai_features: aiFeaturesSchema.default([]),
    flows: flowsSchema.default([]),

    // People: ids from the people collection
    lead_designer: idSchema,
    designers: idListSchema.default([]),
    account_manager: idSchema.optional(),
    delivered_to: z.object({ name: shortTextSchema, role: shortTextSchema.optional() }).optional(),

    // Timeline
    start_date: z.date().optional(),
    delivery_date: z.date().optional(),
    duration_weeks: z.number().positive().max(520).optional(),
    milestones: z.array(milestoneSchema).default([]),

    // Links
    figma_files: linksSchema,
    prototype_url: linksSchema,
    live_url: linksSchema,
    case_study_url: linksSchema,
    drive_folder: linksSchema,

    // Visuals: ids from the visuals collection (phase 5)
    visuals: z.array(idSchema).default([]),

    // Story
    summary: longTextSchema,
    challenge: longTextSchema.optional(),
    what_we_did: longTextSchema.optional(),
    outcomes: longTextSchema.optional(),
    testimonial: longTextSchema.optional(),
    metrics: z.array(metricSchema).default([]),

    // Client-safe
    public_summary: longTextSchema.optional(),
  })
  .refine(
    (project) => !project.start_date || !project.delivery_date || project.delivery_date >= project.start_date,
    { message: "delivery date can't be before the start date", path: ["delivery_date"] },
  );

/** A stored project, as repositories return it. The embedding joins with Voyage in phase 2e. */
export const projectSchema = projectInputSchema.safeExtend({
  id: idSchema,
  // Generated on save for keyword search. Optional only for records saved before it existed.
  search_text: z.string().optional(),
  review_status: reviewStatusSchema,
  updated_by: actorSchema,
  updated_at: z.date(),
  deleted_at: z.date().optional(),
});

export type ProjectInput = z.input<typeof projectInputSchema>;
/** Validated input, with defaults applied. */
export type ProjectFields = z.infer<typeof projectInputSchema>;
export type Project = z.infer<typeof projectSchema>;
