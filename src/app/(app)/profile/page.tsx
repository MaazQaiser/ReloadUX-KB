import type { Metadata } from "next";
import { Suspense } from "react";
import { DesignationForm } from "@/components/auth/designation-form";
import { UserAvatar } from "@/components/auth/user-avatar";
import { PageHeader } from "@/components/page-header";
import { DetailSection, Field, FieldList } from "@/components/project-detail/section";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { USER_ROLE } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/server/auth";

export const metadata: Metadata = { title: "profile" };

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader eyebrow="Account" title="Your profile" description="Your name and photo come from your Google account." />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <ProfileView />
      </Suspense>
    </div>
  );
}

async function ProfileView() {
  const user = await requireRole("viewer");
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-10">
        <div className="flex items-center gap-5">
          <UserAvatar name={user.name} photoUrl={user.photo_url} className="size-20 text-xl" />
          <div className="flex flex-col gap-1">
            <p className="font-heading text-3xl">{user.name}</p>
            <p className="text-soft-foreground">{user.designation ?? USER_ROLE.labels[user.role]}</p>
          </div>
        </div>
        <DesignationForm designation={user.designation} />
      </div>
      <div className="flex flex-col gap-8">
        <DetailSection title="Account">
          <FieldList>
            <Field label="Email">{user.email}</Field>
            <Field label="Access">{USER_ROLE.labels[user.role]}</Field>
            <Field label="Member since">{formatDate(user.created_at)}</Field>
            <Field label="Last signed in">{formatDate(user.last_sign_in_at)}</Field>
          </FieldList>
          <p className="text-xs text-muted-foreground">Only an admin can change your access.</p>
        </DetailSection>
        <form action="/api/auth/signout" method="post">
          <button type="submit" className={buttonVariants({ variant: "outline" })}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
