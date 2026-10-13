import { z } from "zod";
import { actorSchema, httpUrlSchema, idSchema, shortTextSchema } from "./common";
import { userRoleSchema } from "./tags";

/** A signed-in team member. Identity comes from Firebase; the role lives only here. */
export const userSchema = z.object({
  id: idSchema,
  firebase_uid: z.string().min(1).max(128),
  email: z.email().toLowerCase(),
  name: shortTextSchema,
  role: userRoleSchema,
  /** The Google profile photo, refreshed at every sign-in. */
  photo_url: httpUrlSchema.optional(),
  /** Job title people set on their profile, e.g. "Lead Product Designer". */
  designation: z.string().trim().min(1).max(80).optional(),
  created_at: z.date(),
  last_sign_in_at: z.date(),
  updated_by: actorSchema,
  updated_at: z.date(),
});

export type User = z.infer<typeof userSchema>;
