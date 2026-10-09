import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { Skeleton } from "@/components/ui/skeleton";
import { Wordmark } from "@/components/wordmark";
import { getAuthConfig } from "@/env";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/constants";
import { safeNextPath } from "@/lib/safe-redirect";
import { getSessionUser } from "@/server/auth";

export const metadata: Metadata = { title: "sign in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Wordmark />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-muted-foreground">Use your {ALLOWED_EMAIL_DOMAIN} Google account.</p>
        </div>
        <Suspense fallback={<Skeleton className="h-10 w-full" />}>
          <SignInPanel searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function SignInPanel({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const next = safeNextPath((await searchParams).next);
  if (await getSessionUser()) redirect(next);

  const config = getAuthConfig();
  if (!config) {
    return (
      <div role="status" className="rounded-xl border border-dashed p-4 text-sm">
        <p className="font-medium">Sign-in isn&apos;t set up yet.</p>
        <p className="text-muted-foreground">
          An admin needs to add the Firebase settings to the server environment (see .env.example). Until then, the app
          stays locked.
        </p>
      </div>
    );
  }
  return <GoogleSignIn config={config.web} next={next} />;
}
