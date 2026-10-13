import "server-only";
import { cache } from "react";
import { TAG_LIST_NAMES, type TagListName } from "@/lib/constants";
import { err, ok, type Result } from "@/lib/result";
import { keyFromLabel, mergeCatalog, type TagCatalog } from "@/lib/tag-catalog";
import type { User } from "@/schemas/user";
import { insertTagValue, listAddedTagValues } from "@/server/repositories/tag-values";

/** Built-in plus admin-added values, loaded once per request. */
export const getTagCatalog = cache(async (): Promise<TagCatalog> => mergeCatalog(await listAddedTagValues()));

export type AddTagError = "invalid_label" | "already_exists";

export async function addTagValue(admin: User, list: TagListName, rawLabel: string): Promise<Result<{ key: string; label: string }, AddTagError>> {
  const label = rawLabel.trim().replace(/\s+/g, " ");
  const key = keyFromLabel(label);
  if (!TAG_LIST_NAMES.includes(list) || label.length < 2 || label.length > 60 || !/^[a-z][a-z0-9_]{0,59}$/.test(key)) {
    return err("invalid_label");
  }
  const current = (await getTagCatalog())[list];
  const sameLabel = current.keys.some((existing) => (current.labels[existing] ?? "").toLowerCase() === label.toLowerCase());
  if (key in current.labels || sameLabel) return err("already_exists");
  return (await insertTagValue({ list, key, label }, admin.id)) ? ok({ key, label }) : err("already_exists");
}

/** Keys in `values` that aren't in the catalog, per list, for save-time checks. */
export function unknownTags(catalog: TagCatalog, values: Partial<Record<TagListName, readonly string[]>>): Partial<Record<TagListName, string[]>> {
  const unknown: Partial<Record<TagListName, string[]>> = {};
  for (const list of TAG_LIST_NAMES) {
    const missing = (values[list] ?? []).filter((key) => !(key in catalog[list].labels));
    if (missing.length > 0) unknown[list] = missing;
  }
  return unknown;
}
