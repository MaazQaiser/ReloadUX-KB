/**
 * Turns a display name into a URL-safe slug. Slugs are how projects and people
 * are matched across imports, so the same name must always give the same slug.
 */
export function toSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
