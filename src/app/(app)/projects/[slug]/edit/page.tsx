import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { FormSkeleton } from "@/components/project-form/form-skeleton";
import { ProjectForm } from "@/components/project-form/project-form";
import { toFormValues } from "@/lib/project-form";
import { slugSchema } from "@/schemas/common";
import { requireRole } from "@/server/auth";
import { listPeopleForForm } from "@/server/services/people";
import { getProjectForEdit } from "@/server/services/projects";
import { getProjectGallery } from "@/server/services/visuals";
import { VisualsManager } from "@/components/visuals/visuals-manager";

export const metadata: Metadata = { title: "edit project" };

export default function EditProjectPage({ params }: PageProps<"/projects/[slug]/edit">) {
  return (
    <div className="flex flex-col gap-10">
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
  const gallery = await getProjectGallery(project.id);

  return (
    <>
      <Link href={`/projects/${project.slug}`} className="text-sm text-soft-foreground hover:text-foreground">
        ← Back to {project.name}
      </Link>
      <PageHeader
        eyebrow="Edit project"
        title={project.name}
        description={
          project.review_status === "draft"
            ? "This is a draft. Saving it approves it and makes it visible."
            : `Its address stays /projects/${project.slug}.`
        }
      />
      <ProjectForm
        mode="edit"
        initial={toFormValues(project)}
        project={{ id: project.id, slug: project.slug }}
        people={people.map(({ id, name, roles, active }) => ({ id, name, roles, active }))}
      />
      <VisualsManager slug={project.slug} visuals={gallery} />
    </>
  );
}
