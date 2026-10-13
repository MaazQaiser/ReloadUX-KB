import { Suspense } from "react";
import { BASE_NAV_ITEMS, navItemsFor } from "@/lib/navigation";
import { getSessionUser } from "@/server/auth";
import { UserMenu } from "./auth/user-menu";
import { NavLinks, StaticNavLinks } from "./nav-link";
import { Wordmark } from "./wordmark";

/** Links depend on the signed-in role and the URL, both known only at request time. */
async function RoleNav() {
  const user = await getSessionUser();
  return <NavLinks items={navItemsFor(user?.role)} />;
}

export function AppHeader() {
  return (
    <header className="border-b">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-background focus:px-3 focus:py-1"
      >
        Skip to content
      </a>
      {/* Phones: wordmark and account on top, links on their own row below so none get cut off. */}
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-10 px-4 sm:px-8 md:h-20 md:flex-nowrap">
        <div className="flex h-16 items-center md:h-auto">
          <Wordmark />
        </div>
        <nav
          aria-label="Main"
          className="order-last -mx-4 flex h-12 w-[calc(100%+2rem)] items-center gap-6 overflow-x-auto border-t px-4 sm:-mx-8 sm:w-[calc(100%+4rem)] sm:px-8 md:order-none md:mx-0 md:h-auto md:w-auto md:border-t-0 md:px-0"
        >
          <Suspense fallback={<StaticNavLinks items={BASE_NAV_ITEMS} />}>
            <RoleNav />
          </Suspense>
        </nav>
        <div className="ml-auto shrink-0">
          {/* Reads the session, so it streams in after the shell. */}
          <Suspense fallback={null}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
