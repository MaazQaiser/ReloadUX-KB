import { Suspense } from "react";
import { NavLinks, StaticNavLinks, type NavItem } from "./nav-link";
import { Wordmark } from "./wordmark";

const NAV_ITEMS: NavItem[] = [{ href: "/projects", label: "projects" }];

export function AppHeader() {
  return (
    <header className="border-b">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-background focus:px-3 focus:py-1"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
        <Wordmark />
        <nav aria-label="Main" className="flex items-center gap-1">
          {/* The active link depends on the URL, which is only known at request time. */}
          <Suspense fallback={<StaticNavLinks items={NAV_ITEMS} />}>
            <NavLinks items={NAV_ITEMS} />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
