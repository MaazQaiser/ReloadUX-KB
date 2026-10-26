import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { getSessionUser } from "@/server/auth";

export const metadata: Metadata = { title: "waiting for approval" };

export default function PendingPage() {
  return (
    <main id="main" className="rx-landing-bg flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-md flex-col gap-10">
        <Wordmark />
        <Suspense fallback={null}>
          <PendingNotice />
        </Suspense>
      </div>
      {/* Pulse's floating theme toggle; signed-out pages have no header to hold it. */}
      <ThemeToggle className="fixed right-6 bottom-6 z-40 size-11 shadow-pulse-soft-lg" />
    </main>
  );
}

async function PendingNotice() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "pending") redirect("/");

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs tracking-wide text-foreground/60 uppercase">Waiting for approval</p>
      <h1 className="font-heading text-3xl leading-tight italic sm:text-4xl">You&apos;re signed in. An admin needs to let you in.</h1>
      <p className="text-base leading-relaxed text-foreground/70">
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
