import "server-only";
import { and, asc, desc, eq, getTableColumns, gt, ilike, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { projects, visuals } from "@/server/db/schema";
import { actorSchema, type Actor } from "@/schemas/common";
import type { Flow } from "@/schemas/tags";
import { visualEditSchema, visualSchema, type Visual, type VisualEdit } from "@/schemas/visual";
import { escapeLike, fromRow, newId, withNulls } from "./rows";

const LIVE = isNull(visuals.deleted_at);

function toVisual(row: typeof visuals.$inferSelect): Visual {
  return fromRow(visualSchema, "visuals", row);
}

export async function insertVisual(projectId: string, imageKey: string, actor: Actor): Promise<Visual> {
  const db = await getDb();
  const by = actorSchema.parse(actor);
  const [last] = await db
    .select({ order: visuals.order })
    .from(visuals)
    .where(and(eq(visuals.project_id, projectId), LIVE))
    .orderBy(desc(visuals.order))
    .limit(1);
  const now = new Date();
  const [saved] = await db
    .insert(visuals)
    .values({
      id: newId(),
      project_id: projectId,
      image_key: imageKey,
      source: "upload",
      order: last ? last.order + 1 : 0,
      // The first screenshot becomes the cover until an editor picks another.
      is_cover: !last,
      created_by: by,
      created_at: now,
      updated_by: by,
      updated_at: now,
    })
    .returning();
  // Safe: an insert without a conflict clause returns its row or throws.
  return toVisual(saved!);
}

export async function listProjectVisuals(projectId: string): Promise<Visual[]> {
  const rows = await (await getDb()).select().from(visuals).where(and(eq(visuals.project_id, projectId), LIVE)).orderBy(asc(visuals.order));
  return rows.map(toVisual);
}

/** Each project's cover screenshot, by project id; projects without one are left out. */
export async function findCoverVisuals(projectIds: readonly string[]): Promise<Map<string, Visual>> {
  if (projectIds.length === 0) return new Map();
  const rows = await (await getDb())
    .select()
    .from(visuals)
    .where(and(inArray(visuals.project_id, [...projectIds]), eq(visuals.is_cover, true), LIVE));
  return new Map(rows.map((row) => {
    const visual = toVisual(row);
    return [visual.project_id, visual];
  }));
}

export async function findVisual(id: string): Promise<Visual | null> {
  const [row] = await (await getDb()).select().from(visuals).where(and(eq(visuals.id, id), LIVE)).limit(1);
  return row ? toVisual(row) : null;
}

export interface LibraryVisual {
  visual: Visual;
  project: { slug: string; name: string };
}

/** Screens across all live, approved projects, matched on caption or project name. */
export async function searchVisuals({ q, flow }: { q?: string; flow?: Flow }, limit = 120): Promise<LibraryVisual[]> {
  const pattern = q ? `%${escapeLike(q)}%` : null;
  const rows = await (await getDb())
    .select({ visual: getTableColumns(visuals), project: { slug: projects.slug, name: projects.name } })
    .from(visuals)
    .innerJoin(projects, eq(projects.id, visuals.project_id))
    .where(
      and(
        LIVE,
        flow ? eq(visuals.flow, flow) : undefined,
        eq(projects.review_status, "approved"),
        isNull(projects.deleted_at),
        pattern ? or(ilike(visuals.caption, pattern), ilike(projects.name, pattern)) : undefined,
      ),
    )
    .orderBy(asc(projects.name), asc(visuals.order))
    .limit(limit);
  return rows.map(({ visual, project }) => ({ visual: toVisual(visual), project }));
}

export async function updateVisual(id: string, edit: VisualEdit, actor: Actor): Promise<Visual | null> {
  const fields = withNulls(visualEditSchema.parse(edit), ["caption", "flow", "figma_link"]);
  const [saved] = await (await getDb())
    .update(visuals)
    .set({ ...fields, updated_by: actorSchema.parse(actor), updated_at: new Date() })
    .where(and(eq(visuals.id, id), LIVE))
    .returning();
  return saved ? toVisual(saved) : null;
}

export async function setCover(visual: Visual): Promise<void> {
  await (await getDb())
    .update(visuals)
    .set({ is_cover: sql`${visuals.id} = ${visual.id}` })
    .where(eq(visuals.project_id, visual.project_id));
}

/** Swaps a screenshot with its neighbour in the gallery order. */
export async function moveVisual(visual: Visual, direction: "earlier" | "later"): Promise<void> {
  await (await getDb()).transaction(async (tx) => {
    const [neighbour] = await tx
      .select({ id: visuals.id, order: visuals.order })
      .from(visuals)
      .where(
        and(
          eq(visuals.project_id, visual.project_id),
          LIVE,
          direction === "earlier" ? lt(visuals.order, visual.order) : gt(visuals.order, visual.order),
        ),
      )
      .orderBy(direction === "earlier" ? desc(visuals.order) : asc(visuals.order))
      .limit(1);
    if (!neighbour) return;
    await tx.update(visuals).set({ order: visual.order }).where(eq(visuals.id, neighbour.id));
    await tx.update(visuals).set({ order: neighbour.order }).where(eq(visuals.id, visual.id));
  });
}

/** Soft delete: the file and record stay, the gallery stops showing it. */
export async function softDeleteVisual(visual: Visual, actor: Actor): Promise<void> {
  const now = new Date();
  await (await getDb())
    .update(visuals)
    .set({ deleted_at: now, is_cover: false, updated_by: actorSchema.parse(actor), updated_at: now })
    .where(eq(visuals.id, visual.id));
}
