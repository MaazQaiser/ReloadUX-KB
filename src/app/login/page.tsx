import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Wordmark } from "@/components/wordmark";
import { getAuthConfig } from "@/env";
import { safeNextPath } from "@/lib/safe-redirect";
import { getSessionUser } from "@/server/auth";

export const metadata: Metadata = { title: "sign in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    // Pulse's landing: the glass-ring art on light grey, or the chrome ribbon on black in dark mode.
    <main id="main" className="rx-landing-bg flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pt-10 sm:pt-16">
        <Wordmark />
        <div className="flex max-w-2xl flex-1 animate-in flex-col justify-center gap-10 pb-10 duration-500 ease-pulse fade-in-0 slide-in-from-bottom-5 sm:pb-16 motion-reduce:animate-none">
          <div className="flex flex-col gap-4">
            <p className="text-xs tracking-wide text-foreground/60 uppercase">Project intelligence</p>
            <h1 className="font-heading text-3xl leading-tight italic sm:text-4xl md:text-5xl">
              Everything we&apos;ve built, one question away.
            </h1>
          </div>
          <div className="flex w-full max-w-md flex-col gap-4">
            <Suspense fallback={<Skeleton className="h-12 w-full rounded-full" />}>
              <SignInPanel searchParams={searchParams} />
            </Suspense>
          </div>
          <p className="text-sm text-foreground/50">
            Sign in with your Google account. Internal tool for the reloadux team.
          </p>
        </div>
      </div>
      {/* Pulse's floating theme toggle; signed-out pages have no header to hold it. */}
      <ThemeToggle className="fixed right-6 bottom-6 z-40 size-11 shadow-pulse-soft-lg" />
    </main>
  );
}

async function SignInPanel({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const next = safeNextPath((await searchParams).next);
  if (await getSessionUser()) redirect(next);

  const config = getAuthConfig();
  if (!config) {
    return (
      <div role="status" className="flex flex-col gap-1 rounded-3xl border bg-background p-5 text-sm shadow-pulse-soft-lg">
        <p className="font-medium">Sign-in isn&apos;t set up yet.</p>
        <p className="text-foreground/70">
          An admin needs to add the Firebase settings to the server environment (see .env.example). Until then, the app
          stays locked.
        </p>
      </div>
    );
  }
  return <GoogleSignIn config={config.web} next={next} />;
}
