import { hasRole } from "./auth-rules";
import type { UserRole } from "@/schemas/tags";

export interface NavItem {
  href: string;
  label: string;
}

const NAV: { item: NavItem; role: UserRole }[] = [
  { item: { href: "/", label: "home" }, role: "viewer" },
  { item: { href: "/projects", label: "projects" }, role: "viewer" },
  { item: { href: "/users", label: "users" }, role: "admin" },
  { item: { href: "/settings", label: "settings" }, role: "admin" },
];

const LIBRARY_TABS: { item: NavItem; role: UserRole }[] = [
  { item: { href: "/projects", label: "All projects" }, role: "viewer" },
  { item: { href: "/projects/visuals", label: "Visuals" }, role: "viewer" },
  { item: { href: "/projects/drafts", label: "Drafts" }, role: "editor" },
  { item: { href: "/projects/review", label: "Review" }, role: "admin" },
];

function allowed(entries: { item: NavItem; role: UserRole }[], role: UserRole | undefined): NavItem[] {
  if (!role) return [];
  return entries.filter((entry) => hasRole(role, entry.role)).map((entry) => entry.item);
}

/** The header links a role can use. Hiding links is convenience only; every page checks the role itself. */
export function navItemsFor(role: UserRole | undefined): NavItem[] {
  return allowed(NAV, role);
}

/** The project library tabs a role can use; each tab page checks the role itself too. */
export function libraryTabsFor(role: UserRole | undefined): NavItem[] {
  return allowed(LIBRARY_TABS, role);
}

/** What the header shows before the session is known: the links every approved user has. */
export const BASE_NAV_ITEMS: NavItem[] = navItemsFor("viewer");
