"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/navigation";

/** Tabs across the project library. Each tab is its own page, so it can be linked and bookmarked. */
export function LibraryTabs({ tabs }: { tabs: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Project library" className="-mb-px flex gap-8 overflow-x-auto border-b">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 border-transparent pb-3 text-base whitespace-nowrap text-soft-foreground transition-colors hover:text-foreground",
              active && "border-foreground text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
