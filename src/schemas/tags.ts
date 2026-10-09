import { z } from "zod";
import {
  AI_FEATURE,
  FLOW,
  INDUSTRY,
  PERSON_ROLE,
  PRODUCT_TYPE,
  PROJECT_STATUS,
  REVIEW_STATUS,
  SERVICE,
} from "@/lib/constants";
import { uniqueList } from "./common";

export const industrySchema = z.enum(INDUSTRY.keys);
export const projectStatusSchema = z.enum(PROJECT_STATUS.keys);
export const productTypeSchema = z.enum(PRODUCT_TYPE.keys);
export const serviceSchema = z.enum(SERVICE.keys);
export const aiFeatureSchema = z.enum(AI_FEATURE.keys);
export const flowSchema = z.enum(FLOW.keys);
export const personRoleSchema = z.enum(PERSON_ROLE.keys);
export const reviewStatusSchema = z.enum(REVIEW_STATUS.keys);

export const productTypesSchema = uniqueList(productTypeSchema);
export const servicesSchema = uniqueList(serviceSchema);
export const flowsSchema = uniqueList(flowSchema);

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
export type PersonRole = z.infer<typeof personRoleSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
