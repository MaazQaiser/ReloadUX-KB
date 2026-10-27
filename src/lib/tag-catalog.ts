import { EXTENDABLE_TAG_LISTS, type TagListName } from "./constants";

/** One list's values in display order: built-in first, then admin-added. */
export interface CatalogList {
  keys: string[];
  labels: Record<string, string>;
  /** Keys an admin added (shown as such in Settings). */
  added: string[];
}

export type TagCatalog = Record<TagListName, CatalogList>;

/** The catalog with no added values, for places that can't load the database. */
export function builtInCatalog(): TagCatalog {
  return mergeCatalog([]);
}

export function mergeCatalog(added: { list: TagListName; key: string; label: string }[]): TagCatalog {
  const listFor = (name: TagListName): CatalogList => {
    const builtIn: { keys: readonly string[]; labels: Readonly<Record<string, string>> } = EXTENDABLE_TAG_LISTS[name];
    const extra = added.filter((value) => value.list === name && !(value.key in builtIn.labels));
    return {
      keys: [...builtIn.keys, ...extra.map((value) => value.key)],
      labels: { ...builtIn.labels, ...Object.fromEntries(extra.map((value) => [value.key, value.label])) },
      added: extra.map((value) => value.key),
    };
  };
  return {
    industry: listFor("industry"),
    product_types: listFor("product_types"),
    services: listFor("services"),
    ai_features: listFor("ai_features"),
    flows: listFor("flows"),
    business_model: listFor("business_model"),
  };
}

/** A label for any key, falling back to a readable form of the key if it's unknown here. */
export function tagLabel(list: CatalogList, key: string): string {
  return list.labels[key] ?? key.replace(/_/g, " ");
}

export function tagOptions(list: CatalogList): { value: string; label: string }[] {
  return list.keys.map((key) => ({ value: key, label: tagLabel(list, key) }));
}

/** Turns an admin's label into a stable key: "Real estate / PropTech" → "real_estate_proptech". */
export function keyFromLabel(label: string): string {
  return label
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
