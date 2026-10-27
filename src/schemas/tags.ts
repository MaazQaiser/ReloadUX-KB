import { z } from "zod";
import { PERSON_ROLE, PROJECT_STATUS, REVIEW_STATUS, USER_ROLE } from "@/lib/constants";
import { uniqueList } from "./common";

/**
 * Keys for lists admins can extend (see EXTENDABLE_TAG_LISTS). The shape is
 * checked here; that the key really exists (built in or added) is checked
 * by the save services against the tag catalog.
 */
export const tagKeySchema = z.string().regex(/^[a-z][a-z0-9_]{0,59}$/, "isn't a known value");

export const industrySchema = tagKeySchema;
export const projectStatusSchema = z.enum(PROJECT_STATUS.keys);
export const productTypeSchema = tagKeySchema;
export const serviceSchema = tagKeySchema;
export const aiFeatureSchema = tagKeySchema;
export const flowSchema = tagKeySchema;
export const businessModelSchema = tagKeySchema;
export const personRoleSchema = z.enum(PERSON_ROLE.keys);
export const reviewStatusSchema = z.enum(REVIEW_STATUS.keys);
export const userRoleSchema = z.enum(USER_ROLE.keys);

export const productTypesSchema = uniqueList(productTypeSchema);
export const servicesSchema = uniqueList(serviceSchema);
export const flowsSchema = uniqueList(flowSchema);
export const businessModelsSchema = uniqueList(businessModelSchema);

// "none" records that we checked and there is no AI; it can't sit next to a real feature.
export const aiFeaturesSchema = uniqueList(aiFeatureSchema).refine(
  (values) => !values.includes("none") || values.length === 1,
  "\"none\" can't be combined with other AI features",
);

export type Industry = z.infer<typeof industrySchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type ProductType = z.infer<typeof productTypeSchema>;
export type Service = z.infer<typeof serviceSchema>;
export type AiFeature = z.infer<typeof aiFeatureSchema>;
export type Flow = z.infer<typeof flowSchema>;
export type BusinessModel = z.infer<typeof businessModelSchema>;
export type PersonRole = z.infer<typeof personRoleSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
