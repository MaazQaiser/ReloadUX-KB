import { Suspense } from "react";
import { BASE_NAV_ITEMS, navItemsFor } from "@/lib/navigation";
import { getSessionUser } from "@/server/auth";
import { UserMenu } from "./auth/user-menu";
import { ThemeToggle } from "./theme/theme-toggle";
import { NavLinks, StaticNavLinks } from "./nav-link";
import { Wordmark } from "./wordmark";

/** Links depend on the signed-in role and the URL, both known only at request time. */
async function RoleNav() {
  const user = await getSessionUser();
  return <NavLinks items={navItemsFor(user?.role)} />;
}

export function AppHeader() {
  return (
    // Pulse's glass chrome: the page shows through, separated by a soft shadow instead of a rule. Lighter
    // than Pulse's 85% so the page's violet light carries through without a seam at its edge.
    <header className="sticky top-0 z-20 bg-background/55 shadow-pulse-soft backdrop-blur-xl">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded-full focus:bg-background focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      {/* Phones: wordmark and account on top, links on their own row below so none get cut off. */}
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-8 px-4 sm:px-6 md:h-16 md:flex-nowrap">
        <div className="flex h-16 items-center md:h-auto">
          <Wordmark />
        </div>
        <nav
          aria-label="Main"
          className="order-last -mx-4 flex h-12 w-[calc(100%+2rem)] items-center gap-1 overflow-x-auto border-t px-4 sm:-mx-6 sm:w-[calc(100%+3rem)] sm:px-6 md:order-none md:mx-0 md:h-auto md:w-auto md:border-t-0 md:px-0"
        >
          <Suspense fallback={<StaticNavLinks items={BASE_NAV_ITEMS} />}>
            <RoleNav />
          </Suspense>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          {/* Reads the session, so it streams in after the shell. */}
          <Suspense fallback={null}>
            <UserMenu />
          </Suspense>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
