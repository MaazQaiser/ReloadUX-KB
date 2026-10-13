import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { LoginShowcase } from "@/components/auth/login-showcase";
import { Skeleton } from "@/components/ui/skeleton";
import { Wordmark } from "@/components/wordmark";
import { getAuthConfig } from "@/env";
import { safeNextPath } from "@/lib/safe-redirect";
import { getSessionUser } from "@/server/auth";

export const metadata: Metadata = { title: "sign in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main id="main" className="grid flex-1 lg:grid-cols-2">
      <div className="flex flex-col justify-between gap-16 px-6 py-10 sm:px-12 lg:px-16 lg:py-12">
        <Wordmark />
        <div className="flex w-full max-w-md flex-col gap-10">
          <div className="flex flex-col gap-4">
            <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">Project intelligence</p>
            <h1 className="text-5xl leading-tight">Everything we&apos;ve built, one question away.</h1>
            <p className="text-lg text-soft-foreground">Sign in with your Google account.</p>
          </div>
          <Suspense fallback={<Skeleton className="h-12 w-full" />}>
            <SignInPanel searchParams={searchParams} />
          </Suspense>
        </div>
        <p className="text-xs text-muted-foreground">Internal tool for the reloadux team.</p>
      </div>
      <LoginShowcase />
    </main>
  );
}

async function SignInPanel({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const next = safeNextPath((await searchParams).next);
  if (await getSessionUser()) redirect(next);

  const config = getAuthConfig();
  if (!config) {
    return (
      <div role="status" className="border border-dashed p-5 text-sm">
        <p className="font-medium">Sign-in isn&apos;t set up yet.</p>
        <p className="text-soft-foreground">
          An admin needs to add the Firebase settings to the server environment (see .env.example). Until then, the app
          stays locked.
        </p>
      </div>
    );
  }
  return <GoogleSignIn config={config.web} next={next} />;
}
