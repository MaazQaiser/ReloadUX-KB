import "server-only";
import { z } from "zod";
import { err, ok, type Result } from "@/lib/result";
import type { UserRole } from "@/schemas/tags";
import type { User } from "@/schemas/user";
import { listUsers, updateOwnProfile, updateUserRole } from "@/server/repositories/users";

export async function listUsersForSettings(): Promise<User[]> {
  return listUsers();
}

export type ChangeRoleError = "own_role" | "not_found";

/**
 * Approves, promotes or revokes a user. Admins can't change their own role,
 * so the last admin can never lock everyone out by accident.
 */
export async function changeUserRole(
  admin: User,
  targetId: string,
  role: UserRole,
): Promise<Result<User, ChangeRoleError>> {
  if (admin.id === targetId) return err("own_role");
  const updated = await updateUserRole(targetId, role, admin.id);
  return updated ? ok(updated) : err("not_found");
}

const designationSchema = z.string().trim().max(80);

/** People edit only their own designation; name and photo come from Google. */
export async function setOwnDesignation(user: User, raw: string): Promise<Result<User, "invalid" | "not_found">> {
  const designation = designationSchema.safeParse(raw);
  if (!designation.success) return err("invalid");
  const updated = await updateOwnProfile(user.id, { designation: designation.data || undefined });
  return updated ? ok(updated) : err("not_found");
}
