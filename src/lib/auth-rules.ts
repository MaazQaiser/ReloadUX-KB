import { USER_ROLE } from "./constants";
import type { UserRole } from "@/schemas/tags";

/** Roles are ordered: an admin can do everything an editor can, and so on. */
export function hasRole(userRole: UserRole, required: UserRole): boolean {
  return USER_ROLE.keys.indexOf(userRole) >= USER_ROLE.keys.indexOf(required);
}
