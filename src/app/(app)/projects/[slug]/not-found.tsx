import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <div className="flex flex-col items-start gap-3 py-12">
      <h1 className="text-xl font-semibold tracking-tight">Project not found</h1>
      <p className="text-muted-foreground">
        There&apos;s no approved project at this address. It may have been renamed or not approved yet.
      </p>
      <Link href="/projects" className="underline underline-offset-4">
        Browse all projects
      </Link>
    </div>
  );
}
