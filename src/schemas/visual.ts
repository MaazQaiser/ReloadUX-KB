import { z } from "zod";
import { actorSchema, httpUrlSchema, idSchema } from "./common";
import { flowSchema } from "./tags";

/** What an editor can change on a screenshot. Captions double as alt text. */
export const visualEditSchema = z.object({
  caption: z.string().trim().max(300).optional(),
  flow: flowSchema.optional(),
  // Optional "Copy link to selection" link to the source frame (SPEC.md visuals step 5).
  figma_link: httpUrlSchema.optional(),
});

export const visualSchema = visualEditSchema.extend({
  id: idSchema,
  project_id: idSchema,
  image_key: z.string(),
  source: z.enum(["upload", "drive_import"]),
  order: z.number().int().nonnegative(),
  is_cover: z.boolean(),
  created_by: actorSchema,
  created_at: z.date(),
  updated_by: actorSchema,
  updated_at: z.date(),
  deleted_at: z.date().optional(),
});

export type Visual = z.infer<typeof visualSchema>;
export type VisualEdit = z.infer<typeof visualEditSchema>;
