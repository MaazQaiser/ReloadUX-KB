import "server-only";
import { redirect } from "next/navigation";
import { hasRole } from "@/lib/auth-rules";
import { err, ok, type Result } from "@/lib/result";
import type { UserRole } from "@/schemas/tags";
import type { User } from "@/schemas/user";
import { getSessionUser } from "./session";

/**
 * The gate for every page, route handler and server action. Without a valid
 * session it sends the user to sign in; with too low a role, to /forbidden.
 */
export async function requireRole(role: UserRole): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "pending") redirect("/pending");
  if (!hasRole(user.role, role)) redirect("/forbidden");
  return user;
}

export type ApiAuthError = "unauthenticated" | "forbidden";

/**
 * requireRole for route handlers called with fetch, where a redirect would
 * hand the caller a login page instead of a status code it can act on.
 */
export async function requireApiRole(role: UserRole): Promise<Result<User, ApiAuthError>> {
  const user = await getSessionUser();
  if (!user) return err("unauthenticated");
  if (!hasRole(user.role, role)) return err("forbidden");
  return ok(user);
}
