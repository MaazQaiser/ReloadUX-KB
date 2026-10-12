import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/project-form/form-skeleton";
import { ProjectForm } from "@/components/project-form/project-form";
import { toFormValues } from "@/lib/project-form";
import { slugSchema } from "@/schemas/common";
import { requireRole } from "@/server/auth";
import { listPeopleForForm } from "@/server/services/people";
import { getProjectForEdit } from "@/server/services/projects";

export const metadata: Metadata = { title: "edit project" };

export default function EditProjectPage({ params }: PageProps<"/projects/[slug]/edit">) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Suspense fallback={<FormSkeleton />}>
        <EditProjectForm params={params} />
      </Suspense>
    </div>
  );
}

async function EditProjectForm({ params }: { params: Promise<{ slug: string }> }) {
  await requireRole("editor");
  const slug = slugSchema.safeParse((await params).slug);
  if (!slug.success) notFound();

  const [project, people] = await Promise.all([getProjectForEdit(slug.data), listPeopleForForm()]);
  if (!project) notFound();

  return (
    <>
      <Link href={`/projects/${project.slug}`} className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to {project.name}
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Edit {project.name}</h1>
        {project.review_status === "draft" && (
          <p className="text-sm text-muted-foreground">This is a draft. Saving it approves it and makes it visible.</p>
        )}
      </div>
      <ProjectForm
        mode="edit"
        initial={toFormValues(project)}
        project={{ id: project.id, slug: project.slug }}
        people={people.map(({ id, name, roles, active }) => ({ id, name, roles, active }))}
      />
    </>
  );
}
