import { hasRole } from "./auth-rules";
import type { UserRole } from "@/schemas/tags";

export interface NavItem {
  href: string;
  label: string;
}

const NAV: { item: NavItem; role: UserRole }[] = [
  { item: { href: "/", label: "ask" }, role: "viewer" },
  { item: { href: "/projects", label: "projects" }, role: "viewer" },
  { item: { href: "/visuals", label: "visuals" }, role: "viewer" },
  { item: { href: "/admin/chat", label: "admin chat" }, role: "editor" },
  { item: { href: "/review", label: "review" }, role: "admin" },
  { item: { href: "/settings", label: "settings" }, role: "admin" },
];

/** The header links a role can use. Hiding links is convenience only; every page checks the role itself. */
export function navItemsFor(role: UserRole | undefined): NavItem[] {
  if (!role) return [];
  return NAV.filter((entry) => hasRole(role, entry.role)).map((entry) => entry.item);
}

/** What the header shows before the session is known: the links every approved user has. */
export const BASE_NAV_ITEMS: NavItem[] = navItemsFor("viewer");
