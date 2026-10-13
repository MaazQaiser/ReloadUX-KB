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
        "px-1 py-1 text-sm text-soft-foreground underline-offset-8 transition-[color,opacity] hover:text-foreground hover:opacity-70",
        active && "text-foreground underline decoration-1",
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
