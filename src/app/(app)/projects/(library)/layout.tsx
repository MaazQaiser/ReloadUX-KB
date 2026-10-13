import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { LibraryTabs } from "@/components/projects/library-tabs";
import { libraryTabsFor } from "@/lib/navigation";
import { getSessionUser } from "@/server/auth";

/** Shared header and tabs for the library: all projects, visuals, drafts and review. */
export default function LibraryLayout({ children }: LayoutProps<"/projects">) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Projects" title="Everything we've built." />
      <Suspense fallback={<LibraryTabs tabs={libraryTabsFor("viewer")} />}>
        <RoleTabs />
      </Suspense>
      {children}
    </div>
  );
}

async function RoleTabs() {
  const user = await getSessionUser();
  return <LibraryTabs tabs={libraryTabsFor(user?.role)} />;
}
