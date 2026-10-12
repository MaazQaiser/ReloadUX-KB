import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/project-form/form-skeleton";
import { ProjectForm } from "@/components/project-form/project-form";
import { emptyFormValues } from "@/lib/project-form";
import { requireRole } from "@/server/auth";
import { listPeopleForForm } from "@/server/services/people";

export const metadata: Metadata = { title: "new project" };

export default function NewProjectPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">
        ← All projects
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Add a project</h1>
        <p className="text-muted-foreground">Fields marked * are required. Everything else adds to the completeness score.</p>
      </div>
      <Suspense fallback={<FormSkeleton />}>
        <NewProjectForm />
      </Suspense>
    </div>
  );
}

async function NewProjectForm() {
  await requireRole("editor");
  const people = await listPeopleForForm();
  return (
    <ProjectForm
      mode="create"
      initial={emptyFormValues()}
      people={people.map(({ id, name, roles, active }) => ({ id, name, roles, active }))}
    />
  );
}
