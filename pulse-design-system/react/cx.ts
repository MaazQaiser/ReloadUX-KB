// Tiny class-name joiner (stands in for clsx so the kit has no extra dependency).
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
