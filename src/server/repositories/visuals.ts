import "server-only";
import type { Document, WithId } from "mongodb";
import { escapeRegExp } from "@/lib/regex";
import { getDb } from "@/server/db/client";
import { COLLECTIONS } from "@/server/db/collections";
import { actorSchema, type Actor } from "@/schemas/common";
import type { Flow } from "@/schemas/tags";
import { visualEditSchema, visualSchema, type Visual, type VisualEdit } from "@/schemas/visual";
import { fromDocument, toObjectId, toUpdate } from "./mongo";

const LIVE = { deleted_at: { $exists: false } };

async function visuals() {
  return (await getDb()).collection(COLLECTIONS.visuals);
}

function toVisual(document: WithId<Document>): Visual {
  return fromDocument(visualSchema, COLLECTIONS.visuals, { ...document, project_id: String(document.project_id) });
}

export async function insertVisual(projectId: string, imageKey: string, actor: Actor): Promise<Visual> {
  const collection = await visuals();
  const by = actorSchema.parse(actor);
  const last = await collection.find({ project_id: toObjectId(projectId), ...LIVE }).sort({ order: -1 }).limit(1).next();
  const now = new Date();
  const document = {
    project_id: toObjectId(projectId),
    image_key: imageKey,
    source: "upload",
    order: last ? Number(last.order) + 1 : 0,
    // The first screenshot becomes the cover until an editor picks another.
    is_cover: !last,
    created_by: by,
    created_at: now,
    updated_by: by,
    updated_at: now,
  };
  const { insertedId } = await collection.insertOne(document);
  return toVisual({ _id: insertedId, ...document });
}

export async function listProjectVisuals(projectId: string): Promise<Visual[]> {
  const documents = await (await visuals()).find({ project_id: toObjectId(projectId), ...LIVE }).sort({ order: 1 }).toArray();
  return documents.map(toVisual);
}

export async function findVisual(id: string): Promise<Visual | null> {
  const document = await (await visuals()).findOne({ _id: toObjectId(id), ...LIVE });
  return document ? toVisual(document) : null;
}

export interface LibraryVisual {
  visual: Visual;
  project: { slug: string; name: string };
}

/** Screens across all live, approved projects, matched on caption or project name. */
export async function searchVisuals({ q, flow }: { q?: string; flow?: Flow }, limit = 120): Promise<LibraryVisual[]> {
  const pattern = q ? { $regex: escapeRegExp(q), $options: "i" } : null;
  const rows = await (await visuals())
    .aggregate<WithId<Document> & { project: { slug: string; name: string } }>([
      { $match: { ...LIVE, ...(flow && { flow }) } },
      { $lookup: { from: COLLECTIONS.projects, localField: "project_id", foreignField: "_id", as: "project" } },
      { $unwind: "$project" },
      { $match: { "project.review_status": "approved", "project.deleted_at": { $exists: false } } },
      ...(pattern ? [{ $match: { $or: [{ caption: pattern }, { "project.name": pattern }] } }] : []),
      { $sort: { "project.name": 1, order: 1 } },
      { $limit: limit },
      { $project: { "project.slug": 1, "project.name": 1, project_id: 1, image_key: 1, source: 1, order: 1, is_cover: 1, caption: 1, flow: 1, figma_link: 1, created_by: 1, created_at: 1, updated_by: 1, updated_at: 1 } },
    ])
    .toArray();
  return rows.map(({ project, ...document }) => ({ visual: toVisual(document), project: { slug: project.slug, name: project.name } }));
}

export async function updateVisual(id: string, edit: VisualEdit, actor: Actor): Promise<Visual | null> {
  const fields = visualEditSchema.parse(edit);
  const { $set, $unset } = toUpdate({ caption: undefined, flow: undefined, figma_link: undefined, ...fields });
  const saved = await (await visuals()).findOneAndUpdate(
    { _id: toObjectId(id), ...LIVE },
    {
      $set: { ...$set, updated_by: actorSchema.parse(actor), updated_at: new Date() },
      ...(Object.keys($unset).length > 0 && { $unset }),
    },
    { returnDocument: "after" },
  );
  return saved ? toVisual(saved) : null;
}

export async function setCover(visual: Visual): Promise<void> {
  const collection = await visuals();
  await collection.updateMany({ project_id: toObjectId(visual.project_id) }, { $set: { is_cover: false } });
  await collection.updateOne({ _id: toObjectId(visual.id) }, { $set: { is_cover: true } });
}

/** Swaps a screenshot with its neighbour in the gallery order. */
export async function moveVisual(visual: Visual, direction: "earlier" | "later"): Promise<void> {
  const collection = await visuals();
  const neighbour = await collection
    .find({
      project_id: toObjectId(visual.project_id),
      ...LIVE,
      order: direction === "earlier" ? { $lt: visual.order } : { $gt: visual.order },
    })
    .sort({ order: direction === "earlier" ? -1 : 1 })
    .limit(1)
    .next();
  if (!neighbour) return;
  await collection.updateOne({ _id: neighbour._id }, { $set: { order: visual.order } });
  await collection.updateOne({ _id: toObjectId(visual.id) }, { $set: { order: neighbour.order } });
}

/** Soft delete: the file and record stay, the gallery stops showing it. */
export async function softDeleteVisual(visual: Visual, actor: Actor): Promise<void> {
  await (await visuals()).updateOne(
    { _id: toObjectId(visual.id) },
    { $set: { deleted_at: new Date(), is_cover: false, updated_by: actorSchema.parse(actor), updated_at: new Date() } },
  );
}
