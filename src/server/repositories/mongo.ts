import "server-only";
import { ObjectId, type Document, type WithId } from "mongodb";
import type { z } from "zod";

/** Thrown when a stored document no longer matches its schema, e.g. after a manual edit in Atlas. */
export class CorruptDocumentError extends Error {
  constructor(
    readonly collection: string,
    readonly documentId: string,
    readonly issues: z.core.$ZodIssue[],
  ) {
    super(`Document ${collection}/${documentId} does not match its schema`);
    this.name = "CorruptDocumentError";
  }
}

export function toObjectId(id: string): ObjectId {
  return ObjectId.createFromHexString(id);
}

/** Validates a stored document and swaps Mongo's `_id` for a string `id`. */
export function fromDocument<T extends z.ZodType>(
  schema: T,
  collection: string,
  { _id, ...fields }: WithId<Document>,
): z.infer<T> {
  const result = schema.safeParse({ ...fields, id: _id.toHexString() });
  if (!result.success) throw new CorruptDocumentError(collection, _id.toHexString(), result.error.issues);
  return result.data;
}

/**
 * Splits fields into `$set` and `$unset`. Without this the driver stores
 * `undefined` as `null`, and clearing an optional field would leave a null
 * that fails validation on the next read.
 */
export function toUpdate(fields: Record<string, unknown>): { $set: Document; $unset: Record<string, ""> } {
  const $set: Document = {};
  const $unset: Record<string, ""> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) $unset[key] = "";
    else $set[key] = value;
  }
  return { $set, $unset };
}
