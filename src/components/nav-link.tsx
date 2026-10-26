"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function NavAnchor({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-sm text-foreground/60 transition-colors duration-200 outline-none hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/15",
        active && "bg-muted font-medium text-foreground",
      )}
    >
      {item.label}
    </Link>
  );
}

/** Links without the active highlight: the prerendered shell, before the URL is known. */
export function StaticNavLinks({ items }: { items: NavItem[] }) {
  return items.map((item) => <NavAnchor key={item.href} item={item} active={false} />);
}

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return items.map((item) => (
    <NavAnchor
      key={item.href}
      item={item}
      active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
    />
  ));
}
