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
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center gap-10 px-4 sm:px-8">
        <Wordmark />
        <nav aria-label="Main" className="flex items-center gap-6 overflow-x-auto">
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
