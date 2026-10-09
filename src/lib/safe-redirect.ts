/**
 * Returns `next` only if it is a path on this site, so a crafted
 * /login?next=https://evil.example can't bounce people elsewhere after sign-in.
 */
export function safeNextPath(next: string | string[] | undefined, fallback = "/projects"): string {
  const value = Array.isArray(next) ? next[0] : next;
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

/** True when a request's Origin header matches the host it was sent to (CSRF guard for cookie-auth POSTs). */
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
