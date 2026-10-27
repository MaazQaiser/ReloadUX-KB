import "server-only";
import { MongoServerError, type Db, type IndexDescription } from "mongodb";
import { AI_CONFIG } from "@/server/ai/config";
import { COLLECTIONS, type CollectionName } from "./collections";

export interface IndexDefinition {
  collection: CollectionName;
  index: IndexDescription & { name: string };
}

/**
 * Every regular index the app relies on. The Atlas Vector Search index is
 * SEARCH_INDEXES below; it can only be created on an Atlas cluster.
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
  // Keyword half of project search. A regular text index works on any MongoDB, so search behaves
  // the same locally, in tests and on Atlas; names outweigh the rest of the record.
  {
    collection: COLLECTIONS.projects,
    index: {
      name: "search_text",
      key: { name: "text", client_name: "text", search_text: "text" },
      weights: { name: 10, client_name: 5, search_text: 1 },
      default_language: "english",
    },
  },
  { collection: COLLECTIONS.projectChunks, index: { name: "project_field", key: { project_id: 1, field: 1, ordinal: 1 } } },
];

/** Atlas Vector Search over project chunks: the meaning half of project search. */
export const CHUNK_VECTOR_INDEX = "chunk_embedding";

export interface SearchIndexDefinition {
  collection: CollectionName;
  name: string;
  type: "vectorSearch";
  definition: Record<string, unknown>;
}

export const SEARCH_INDEXES: readonly SearchIndexDefinition[] = [
  {
    collection: COLLECTIONS.projectChunks,
    name: CHUNK_VECTOR_INDEX,
    type: "vectorSearch",
    definition: {
      fields: [
        { type: "vector", path: "embedding", numDimensions: AI_CONFIG.voyage.dimensions, similarity: "cosine" },
        { type: "filter", path: "project_id" },
      ],
    },
  },
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
  weights?: Record<string, number>;
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

/** MongoDB reports a text index as `{ _fts, _ftsx }` plus weights, so compare its fields and weights instead. */
function sameTextIndex(existing: ExistingIndex, wanted: IndexDefinition["index"]): boolean {
  const fields = Object.entries(wanted.key)
    .filter(([, kind]) => kind === "text")
    .map(([field]) => field);
  const wantedWeights = Object.fromEntries(fields.map((field) => [field, wanted.weights?.[field] ?? 1]));
  const sorted = (weights: Record<string, unknown>) => JSON.stringify(Object.entries(weights).sort(([a], [b]) => a.localeCompare(b)));
  return existing.key._fts === "text" && sorted(existing.weights ?? {}) === sorted(wantedWeights);
}

function sameDefinition(existing: ExistingIndex, wanted: IndexDefinition["index"]): boolean {
  if (Object.values(wanted.key).includes("text")) return sameTextIndex(existing, wanted);
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

export type SearchIndexAction = "create" | "unchanged" | "unsupported";

export interface SearchIndexSyncResult {
  collection: CollectionName;
  name: string;
  action: SearchIndexAction;
}

const NAMESPACE_EXISTS = 48;

/**
 * Creates missing Atlas Search / Vector Search indexes. A database that isn't
 * Atlas can't hold them, so each is reported as "unsupported" rather than
 * failing; search then uses its in-app fallback.
 */
export async function syncSearchIndexes(
  db: Db,
  { dryRun, definitions = SEARCH_INDEXES }: { dryRun: boolean; definitions?: readonly SearchIndexDefinition[] },
): Promise<SearchIndexSyncResult[]> {
  const results: SearchIndexSyncResult[] = [];
  for (const { collection, name, type, definition } of definitions) {
    let exists: boolean;
    try {
      exists = (await db.collection(collection).listSearchIndexes(name).toArray()).length > 0;
    } catch (error) {
      if (!(error instanceof MongoServerError)) throw error;
      results.push({ collection, name, action: "unsupported" });
      continue;
    }
    if (!exists && !dryRun) {
      // Atlas needs the collection to exist before it can index it.
      await db.createCollection(collection).catch((error: unknown) => {
        if (!(error instanceof MongoServerError && error.code === NAMESPACE_EXISTS)) throw error;
      });
      await db.collection(collection).createSearchIndex({ name, type, definition });
    }
    results.push({ collection, name, action: exists ? "unchanged" : "create" });
  }
  return results;
}
