import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import {
  EvalSection,
  IntegrationsSection,
  LibraryHealthSection,
  TagListsSection,
  UsersSection,
} from "@/components/settings/settings-sections";
import { Skeleton } from "@/components/ui/skeleton";
import { getIntegrations } from "@/env";
import { requireRole } from "@/server/auth";
import { getLibraryHealth } from "@/server/services/analytics";
import { getAskAnalytics } from "@/server/services/learning";
import { listUsersForSettings } from "@/server/services/users";

export const metadata: Metadata = { title: "settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Admin"
        title="Settings and analytics"
        description="Who can get in and what they can do, which services are connected, and how complete the library is."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <SettingsView />
      </Suspense>
    </div>
  );
}

async function SettingsView() {
  const admin = await requireRole("admin");
  const [users, health, ask] = await Promise.all([listUsersForSettings(), getLibraryHealth(), getAskAnalytics()]);
  return (
    <div className="flex flex-col gap-12">
      <UsersSection users={users} currentUserId={admin.id} />
      <IntegrationsSection integrations={getIntegrations()} />
      <LibraryHealthSection health={health} ask={ask} />
      <TagListsSection />
      <EvalSection />
    </div>
  );
}
