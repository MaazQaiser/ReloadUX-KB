import { z } from "zod";
import { actorSchema, idSchema, slugSchema, uniqueList } from "./common";
import { personRoleSchema } from "./tags";

/** What a caller provides when creating or editing a person. */
export const personInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: slugSchema,
  email: z.email().trim().toLowerCase().optional(),
  roles: uniqueList(personRoleSchema).min(1, "pick at least one role"),
  active: z.boolean().default(true),
});

/** A stored person, as repositories return it. */
export const personSchema = personInputSchema.extend({
  id: idSchema,
  updated_by: actorSchema,
  updated_at: z.date(),
  deleted_at: z.date().optional(),
});

export type PersonInput = z.input<typeof personInputSchema>;
export type Person = z.infer<typeof personSchema>;
