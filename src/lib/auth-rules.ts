import { ALLOWED_EMAIL_DOMAIN, USER_ROLE } from "./constants";
import type { UserRole } from "@/schemas/tags";

/**
 * True only for addresses on exactly the allowed domain. Subdomains and
 * look-alikes ("reloadux.com.evil.io", "x@sub.reloadux.com") are refused.
 */
export function isAllowedEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at !== email.indexOf("@")) return false;
  return email.slice(at + 1).toLowerCase() === ALLOWED_EMAIL_DOMAIN;
}

/** Roles are ordered: an admin can do everything an editor can, and so on. */
export function hasRole(userRole: UserRole, required: UserRole): boolean {
  return USER_ROLE.keys.indexOf(userRole) >= USER_ROLE.keys.indexOf(required);
}
