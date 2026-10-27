import "server-only";
import { asc } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { tagValues } from "@/server/db/schema";
import { TAG_LIST_NAMES, type TagListName } from "@/lib/constants";
import { actorSchema, type Actor } from "@/schemas/common";
import { newId } from "./rows";

export interface AddedTagValue {
  list: TagListName;
  key: string;
  label: string;
}

function isTagListName(list: string): list is TagListName {
  return (TAG_LIST_NAMES as readonly string[]).includes(list);
}

export async function listAddedTagValues(): Promise<AddedTagValue[]> {
  const rows = await (await getDb())
    .select({ list: tagValues.list, key: tagValues.key, label: tagValues.label })
    .from(tagValues)
    .orderBy(asc(tagValues.created_at));
  return rows.flatMap(({ list, key, label }) => (isTagListName(list) ? [{ list, key, label }] : []));
}

/** False when the list already has this key (the unique index decides). */
export async function insertTagValue(value: AddedTagValue, actor: Actor): Promise<boolean> {
  const saved = await (await getDb())
    .insert(tagValues)
    .values({ id: newId(), ...value, created_by: actorSchema.parse(actor), created_at: new Date() })
    .onConflictDoNothing({ target: [tagValues.list, tagValues.key] })
    .returning({ id: tagValues.id });
  return saved.length === 1;
}
