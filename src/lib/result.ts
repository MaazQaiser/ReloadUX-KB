import type { z } from "zod";

/** For expected failures: callers must check `ok` instead of catching. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export interface ValidationIssue {
  path: string;
  message: string;
}

export function ok<T>(value: T): { ok: true; value: T } {
  return { ok: true, value };
}

export function err<E>(error: E): { ok: false; error: E } {
  return { ok: false, error };
}

/** Flattens Zod issues into dotted paths a form can show next to its fields. */
export function toValidationIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
}
