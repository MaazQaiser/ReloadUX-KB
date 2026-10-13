import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { FormSkeleton } from "@/components/project-form/form-skeleton";
import { ProjectForm } from "@/components/project-form/project-form";
import { emptyFormValues } from "@/lib/project-form";
import { requireRole } from "@/server/auth";
import { listPeopleForForm } from "@/server/services/people";
import { getTagCatalog } from "@/server/services/tags";

export const metadata: Metadata = { title: "new project" };

export default function NewProjectPage() {
  return (
    <div className="flex flex-col gap-10">
      <Link href="/projects" className="text-sm text-soft-foreground hover:text-foreground">
        ← All projects
      </Link>
      <PageHeader
        eyebrow="New project"
        title="Add a project"
        description="Fields marked * are required. Everything else adds to the completeness score."
      />
      <Suspense fallback={<FormSkeleton />}>
        <NewProjectForm />
      </Suspense>
    </div>
  );
}

async function NewProjectForm() {
  await requireRole("editor");
  const [people, catalog] = await Promise.all([listPeopleForForm(), getTagCatalog()]);
  return (
    <ProjectForm
      mode="create"
      initial={emptyFormValues()}
      catalog={catalog}
      people={people.map(({ id, name, roles, active }) => ({ id, name, roles, active }))}
    />
  );
}
