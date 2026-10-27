import "server-only";
import { randomBytes } from "node:crypto";
import type { z } from "zod";

/** Thrown when a stored row no longer matches its schema, e.g. after a manual edit in pgAdmin. */
export class CorruptRowError extends Error {
  constructor(
    readonly table: string,
    readonly rowId: string,
    readonly issues: z.core.$ZodIssue[],
  ) {
    super(`Row ${table}/${rowId} does not match its schema`);
    this.name = "CorruptRowError";
  }
}

/** A new record id: 24 hex characters, the same shape as ids from before the move to Postgres. */
export function newId(): string {
  return randomBytes(12).toString("hex");
}

/**
 * Validates a row into its domain type. Empty columns come back as null,
 * while the schemas mark them optional, so null fields are dropped first,
 * except `nullable` ones where null is a value in its own right.
 */
export function fromRow<T extends z.ZodType>(
  schema: T,
  table: string,
  row: { id: string } & Record<string, unknown>,
  nullable: readonly string[] = [],
): z.infer<T> {
  const fields = Object.fromEntries(Object.entries(row).filter(([key, value]) => value !== null || nullable.includes(key)));
  const result = schema.safeParse(fields);
  if (!result.success) throw new CorruptRowError(table, row.id, result.error.issues);
  return result.data;
}

/**
 * Turns absent optional fields into nulls. Drizzle skips undefined values in
 * an update, so without this clearing a field in a form would keep the old value.
 */
export function withNulls<T extends Record<string, unknown>>(fields: T, keys: readonly string[]): T {
  return { ...Object.fromEntries(keys.map((key) => [key, null])), ...stripUndefined(fields) };
}

function stripUndefined<T extends Record<string, unknown>>(fields: T): T {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined)) as T;
}

/** A copy of the object without the given keys. */
export function omit<T extends object, K extends keyof T>(value: T, ...keys: K[]): Omit<T, K> {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key as K))) as Omit<T, K>;
}

/** Escapes LIKE wildcards so user text matches literally. */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (character) => `\\${character}`);
}
