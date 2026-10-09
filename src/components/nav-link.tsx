"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
}

function NavAnchor({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground",
        active && "font-medium text-foreground",
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
