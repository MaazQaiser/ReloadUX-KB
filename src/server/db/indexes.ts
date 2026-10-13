import "server-only";
import { MongoServerError, type Db, type IndexDescription } from "mongodb";
import { COLLECTIONS, type CollectionName } from "./collections";

export interface IndexDefinition {
  collection: CollectionName;
  index: IndexDescription & { name: string };
}

/**
 * Every regular index the app relies on. Atlas Search and Vector Search
 * indexes join this file in phase 2.
 */
export const INDEXES: readonly IndexDefinition[] = [
  { collection: COLLECTIONS.projects, index: { name: "slug_unique", key: { slug: 1 }, unique: true } },
  { collection: COLLECTIONS.people, index: { name: "slug_unique", key: { slug: 1 }, unique: true } },
  { collection: COLLECTIONS.users, index: { name: "email_unique", key: { email: 1 }, unique: true } },
  { collection: COLLECTIONS.users, index: { name: "firebase_uid_unique", key: { firebase_uid: 1 }, unique: true } },
  { collection: COLLECTIONS.conversations, index: { name: "turn_id_unique", key: { turn_id: 1 }, unique: true } },
  { collection: COLLECTIONS.conversations, index: { name: "created_at", key: { created_at: -1 } } },
  { collection: COLLECTIONS.knowledgeGaps, index: { name: "status_created", key: { status: 1, created_at: -1 } } },
  { collection: COLLECTIONS.visuals, index: { name: "project_order", key: { project_id: 1, order: 1 } } },
  { collection: COLLECTIONS.tagValues, index: { name: "list_key_unique", key: { list: 1, key: 1 }, unique: true } },
];

export type IndexAction = "create" | "unchanged" | "conflict";

export interface IndexSyncResult {
  collection: CollectionName;
  name: string;
  action: IndexAction;
}

interface ExistingIndex {
  name: string;
  key: Record<string, unknown>;
  unique?: boolean;
  partialFilterExpression?: unknown;
}

const NAMESPACE_NOT_FOUND = 26;

async function listExistingIndexes(db: Db, collection: CollectionName): Promise<ExistingIndex[]> {
  try {
    return await db.collection(collection).listIndexes().toArray() as ExistingIndex[];
  } catch (error) {
    if (error instanceof MongoServerError && error.code === NAMESPACE_NOT_FOUND) return [];
    throw error;
  }
}

function sameDefinition(existing: ExistingIndex, wanted: IndexDefinition["index"]): boolean {
  // Key order matters for compound indexes, so compare entries in order.
  return (
    JSON.stringify(Object.entries(existing.key)) === JSON.stringify(Object.entries(wanted.key)) &&
    (existing.unique ?? false) === (wanted.unique ?? false) &&
    JSON.stringify(existing.partialFilterExpression) === JSON.stringify(wanted.partialFilterExpression)
  );
}

/**
 * Creates missing indexes. An index that exists under the same name with a
 * different definition is reported as a conflict and left alone: dropping it
 * is a manual, confirmed step.
 */
export async function syncIndexes(
  db: Db,
  { dryRun, definitions = INDEXES }: { dryRun: boolean; definitions?: readonly IndexDefinition[] },
): Promise<IndexSyncResult[]> {
  const results: IndexSyncResult[] = [];

  for (const { collection, index } of definitions) {
    const existing = (await listExistingIndexes(db, collection)).find((item) => item.name === index.name);
    const action: IndexAction = !existing ? "create" : sameDefinition(existing, index) ? "unchanged" : "conflict";

    if (action === "create" && !dryRun) {
      await db.collection(collection).createIndexes([index]);
    }
    results.push({ collection, name: index.name, action });
  }

  return results;
}
