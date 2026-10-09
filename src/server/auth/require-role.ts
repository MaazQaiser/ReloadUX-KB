import "server-only";
import { redirect } from "next/navigation";
import { hasRole } from "@/lib/auth-rules";
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
  if (!hasRole(user.role, role)) redirect("/forbidden");
  return user;
}
