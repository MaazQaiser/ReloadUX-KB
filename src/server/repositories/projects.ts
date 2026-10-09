import "server-only";
import { ObjectId, type Document, type Filter, type WithId } from "mongodb";
import { z } from "zod";
import { escapeRegExp } from "@/lib/regex";
import { getDb } from "@/server/db/client";
import { COLLECTIONS } from "@/server/db/collections";
import { actorSchema, type Actor } from "@/schemas/common";
import { projectInputSchema, projectSchema, type Project, type ProjectInput } from "@/schemas/project";
import type { Pagination, ProjectFilters } from "@/schemas/project-filters";
import { reviewStatusSchema, type ReviewStatus } from "@/schemas/tags";
import { fromDocument, toObjectId, toUpdate } from "./mongo";

type ParsedProjectInput = z.infer<typeof projectInputSchema>;

// Only approved, live records are visible; drafts wait in the review queue (phase 4).
const VISIBLE: Filter<Document> = { review_status: "approved", deleted_at: { $exists: false } };

// Optional fields with no default. Each is unset when absent, so an edit can clear it.
const OPTIONAL_FIELDS = Object.entries(projectInputSchema.shape)
  .filter(([, schema]) => schema instanceof z.ZodOptional)
  .map(([key]) => key);

async function projects() {
  return (await getDb()).collection(COLLECTIONS.projects);
}

/** References are stored as ObjectIds so later queries can join to people and visuals. */
function toStoredReferences(project: ParsedProjectInput) {
  return {
    ...project,
    lead_designer: toObjectId(project.lead_designer),
    designers: project.designers.map(toObjectId),
    account_manager: project.account_manager && toObjectId(project.account_manager),
    visuals: project.visuals.map(toObjectId),
  };
}

function idToString(value: unknown): unknown {
  return value instanceof ObjectId ? value.toHexString() : value;
}

function toProject(document: WithId<Document>): Project {
  return fromDocument(projectSchema, COLLECTIONS.projects, {
    ...document,
    lead_designer: idToString(document.lead_designer),
    designers: Array.isArray(document.designers) ? document.designers.map(idToString) : document.designers,
    account_manager: idToString(document.account_manager),
    visuals: Array.isArray(document.visuals) ? document.visuals.map(idToString) : document.visuals,
  });
}

/** Creates or updates the project with this slug, so seeds and imports can run twice. */
export async function upsertProjectBySlug(
  input: ProjectInput,
  { actor, reviewStatus }: { actor: Actor; reviewStatus: ReviewStatus },
): Promise<Project> {
  const project = projectInputSchema.parse(input);
  const absent = Object.fromEntries(OPTIONAL_FIELDS.map((key) => [key, undefined]));
  const { $set, $unset } = toUpdate({ ...absent, ...toStoredReferences(project) });

  const saved = await (await projects()).findOneAndUpdate(
    { slug: project.slug },
    {
      $set: {
        ...$set,
        review_status: reviewStatusSchema.parse(reviewStatus),
        updated_by: actorSchema.parse(actor),
        updated_at: new Date(),
      },
      ...(Object.keys($unset).length > 0 && { $unset }),
    },
    { upsert: true, returnDocument: "after" },
  );
  // Safe: with upsert and returnDocument "after", Mongo always returns the document.
  return toProject(saved!);
}

export async function findProjectBySlug(slug: string): Promise<Project | null> {
  const document = await (await projects()).findOne({ slug, ...VISIBLE });
  return document ? toProject(document) : null;
}

function toQuery(filters: ProjectFilters): Filter<Document> {
  const conditions: Filter<Document>[] = [VISIBLE];

  if (filters.q) {
    const pattern = { $regex: escapeRegExp(filters.q), $options: "i" };
    conditions.push({ $or: [{ name: pattern }, { client_name: pattern }] });
  }
  if (filters.industry) conditions.push({ industry: filters.industry });
  if (filters.product_type) conditions.push({ product_types: filters.product_type });
  if (filters.ai_feature) conditions.push({ ai_features: filters.ai_feature });
  if (filters.flow) conditions.push({ flows: filters.flow });
  if (filters.designer) {
    const designer = toObjectId(filters.designer);
    conditions.push({ $or: [{ lead_designer: designer }, { designers: designer }] });
  }
  if (filters.year) {
    conditions.push({
      delivery_date: { $gte: new Date(Date.UTC(filters.year, 0, 1)), $lt: new Date(Date.UTC(filters.year + 1, 0, 1)) },
    });
  }

  return { $and: conditions };
}

export interface ProjectPage {
  items: Project[];
  total: number;
}

/** Newest deliveries first; undated projects (often ongoing) last, then by name. */
export async function listProjects(filters: ProjectFilters, { page, page_size }: Pagination): Promise<ProjectPage> {
  const collection = await projects();
  const query = toQuery(filters);

  const [documents, total] = await Promise.all([
    collection
      .find(query)
      .sort({ delivery_date: -1, name: 1 })
      .collation({ locale: "en", strength: 2 })
      .skip((page - 1) * page_size)
      .limit(page_size)
      .toArray(),
    collection.countDocuments(query),
  ]);

  return { items: documents.map(toProject), total };
}

/** Delivery years that have at least one visible project, newest first, for the year filter. */
export async function listDeliveryYears(): Promise<number[]> {
  const rows = await (await projects())
    .aggregate<{ _id: number }>([
      { $match: { ...VISIBLE, delivery_date: { $type: "date" } } },
      { $group: { _id: { $year: "$delivery_date" } } },
      { $sort: { _id: -1 } },
    ])
    .toArray();
  return rows.map((row) => row._id);
}
