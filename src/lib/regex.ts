/** Escapes text so it matches literally inside a RegExp or a Mongo $regex. */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
