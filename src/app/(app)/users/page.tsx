import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { UsersSection } from "@/components/settings/settings-sections";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/server/auth";
import { listUsersForSettings } from "@/server/services/users";

export const metadata: Metadata = { title: "users" };

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Admin"
        title="Users"
        description="Approve people who signed in, and choose what each person can do."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <UsersView />
      </Suspense>
    </div>
  );
}

async function UsersView() {
  const admin = await requireRole("admin");
  const users = await listUsersForSettings();
  return <UsersSection users={users} currentUserId={admin.id} />;
}
