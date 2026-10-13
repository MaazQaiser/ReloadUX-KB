import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import {
  EvalSection,
  IntegrationsSection,
  LibraryHealthSection,
  TagListsSection,
} from "@/components/settings/settings-sections";
import { Skeleton } from "@/components/ui/skeleton";
import { getIntegrations } from "@/env";
import { requireRole } from "@/server/auth";
import { getLibraryHealth } from "@/server/services/analytics";
import { getAskAnalytics } from "@/server/services/learning";
import { getTagCatalog } from "@/server/services/tags";

export const metadata: Metadata = { title: "settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Admin"
        title="Settings and analytics"
        description="Which services are connected, how complete the library is, the tag lists and the agent's scores. People and access are under Users."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <SettingsView />
      </Suspense>
    </div>
  );
}

async function SettingsView() {
  await requireRole("admin");
  const [health, ask, catalog] = await Promise.all([
    getLibraryHealth(),
    getAskAnalytics(),
    getTagCatalog(),
  ]);
  return (
    <div className="flex flex-col gap-12">
      <IntegrationsSection integrations={getIntegrations()} />
      <LibraryHealthSection health={health} ask={ask} />
      <TagListsSection catalog={catalog} />
      <EvalSection />
    </div>
  );
}
