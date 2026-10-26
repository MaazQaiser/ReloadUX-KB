"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/navigation";

/** Pulse mode pills across the project library. Each tab is its own page, so it can be linked and bookmarked. */
export function LibraryTabs({ tabs }: { tabs: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Project library" className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm whitespace-nowrap text-foreground/70 transition-colors duration-300 outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/15",
              active && "border-primary bg-primary text-primary-foreground shadow-pulse-soft hover:bg-primary",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
