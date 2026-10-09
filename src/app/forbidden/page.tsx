import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "no access" };

export default function ForbiddenPage() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-6xl flex-col items-start gap-3 px-4 py-16">
      <h1 className="text-xl font-semibold tracking-tight">You don&apos;t have access to this page</h1>
      <p className="text-muted-foreground">Ask an admin if you need a different role.</p>
      <Link href="/projects" className="underline underline-offset-4">
        Go to projects
      </Link>
    </main>
  );
}
