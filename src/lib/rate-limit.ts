/**
 * A fixed-window limiter kept in memory. Good enough for one server; on
 * Vercel each instance counts separately, so move this to a shared store
 * (e.g. Postgres or Upstash) before relying on it there.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const windows = new Map<string, { start: number; count: number }>();
  return function allow(key: string, now = Date.now()): boolean {
    const current = windows.get(key);
    if (!current || now - current.start >= windowMs) {
      windows.set(key, { start: now, count: 1 });
      return true;
    }
    if (current.count >= limit) return false;
    current.count += 1;
    return true;
  };
}
