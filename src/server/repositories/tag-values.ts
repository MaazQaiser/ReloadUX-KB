import "server-only";
import { MongoServerError } from "mongodb";
import { getDb } from "@/server/db/client";
import { COLLECTIONS } from "@/server/db/collections";
import { TAG_LIST_NAMES, type TagListName } from "@/lib/constants";
import { actorSchema, type Actor } from "@/schemas/common";

export interface AddedTagValue {
  list: TagListName;
  key: string;
  label: string;
}

async function tagValues() {
  return (await getDb()).collection(COLLECTIONS.tagValues);
}

export async function listAddedTagValues(): Promise<AddedTagValue[]> {
  const documents = await (await tagValues()).find({}).sort({ created_at: 1 }).toArray();
  return documents
    .filter((document): document is typeof document & AddedTagValue =>
      TAG_LIST_NAMES.includes(document.list) && typeof document.key === "string" && typeof document.label === "string",
    )
    .map(({ list, key, label }) => ({ list, key, label }));
}

/** False when the list already has this key (the unique index decides). */
export async function insertTagValue(value: AddedTagValue, actor: Actor): Promise<boolean> {
  try {
    await (await tagValues()).insertOne({ ...value, created_by: actorSchema.parse(actor), created_at: new Date() });
    return true;
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) return false;
    throw error;
  }
}
