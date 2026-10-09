import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-start gap-3 px-4 py-16">
      <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">There&apos;s nothing at this address.</p>
      <Link href="/projects" className="underline underline-offset-4">
        Go to projects
      </Link>
    </main>
  );
}
