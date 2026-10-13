import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { getSessionUser } from "@/server/auth";

export const metadata: Metadata = { title: "waiting for approval" };

export default function PendingPage() {
  return (
    <main id="main" className="rx-glow-band flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-md flex-col gap-10">
        <Wordmark />
        <Suspense fallback={null}>
          <PendingNotice />
        </Suspense>
      </div>
    </main>
  );
}

async function PendingNotice() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "pending") redirect("/");

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">Waiting for approval</p>
      <h1 className="text-5xl leading-tight">You&apos;re signed in. An admin needs to let you in.</h1>
      <p className="text-lg text-soft-foreground">
        We&apos;ve recorded {user.email}. Once an admin approves you in Settings, sign in again or refresh this page.
      </p>
      <form action="/api/auth/signout" method="post">
        <button type="submit" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Sign out
        </button>
      </form>
    </div>
  );
}
