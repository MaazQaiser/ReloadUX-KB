import "server-only";
import { err, ok, type Result } from "@/lib/result";
import type { UserRole } from "@/schemas/tags";
import type { User } from "@/schemas/user";
import { listUsers, updateUserRole } from "@/server/repositories/users";

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
