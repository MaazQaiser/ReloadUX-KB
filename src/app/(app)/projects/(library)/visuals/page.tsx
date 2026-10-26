import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DetailSection } from "@/components/project-detail/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { VisualImage } from "@/components/visuals/visual-image";
import { tagLabel, tagOptions } from "@/lib/tag-catalog";
import { flowSchema } from "@/schemas/tags";
import { getTagCatalog } from "@/server/services/tags";
import { requireRole } from "@/server/auth";
import { listFigmaFilesByProject, searchLibrary } from "@/server/services/visuals";

export const metadata: Metadata = { title: "visuals" };

export default function VisualsPage({ searchParams }: PageProps<"/projects/visuals">) {
  return (
    <div className="flex flex-col gap-10">
      <p className="max-w-3xl text-soft-foreground">
        Final screens across every project. Search like &ldquo;healthcare onboarding&rdquo; and jump to the Figma frame behind each one.
      </p>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <VisualsView searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function VisualsView({ searchParams }: { searchParams: PageProps<"/projects/visuals">["searchParams"] }) {
  await requireRole("viewer");
  const params = await searchParams;
  const q = first(params.q)?.trim().slice(0, 100) || undefined;
  const flow = flowSchema.safeParse(first(params.flow)).data;
  const [results, figma, catalog] = await Promise.all([searchLibrary({ q, flow }), listFigmaFilesByProject(), getTagCatalog()]);
  const filtered = Boolean(q || flow);

  return (
    <div className="flex flex-col gap-12">
      <form action="/projects/visuals" method="get" role="search" aria-label="Search screens" className="grid gap-3 sm:grid-cols-[1fr_14rem_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="visual-q">Search captions and projects</Label>
          <Input id="visual-q" name="q" type="search" defaultValue={q} className="h-12 text-base" placeholder="healthcare onboarding" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="visual-flow">Flow</Label>
          <NativeSelect id="visual-flow" name="flow" defaultValue={flow ?? ""} className="w-full">
            <NativeSelectOption value="">Any</NativeSelectOption>
            {tagOptions(catalog.flows).map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" size="lg">Search</Button>
      </form>

      {results.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border bg-muted p-8">
          <h2 className="text-2xl">{filtered ? "No screens match" : "No screenshots yet"}</h2>
          <p className="max-w-2xl text-soft-foreground">
            {filtered
              ? "Try fewer words, or a project name."
              : "Editors add 3 to 8 final screens from each project's edit page. Captions are written by hand for now; automatic captions come with the Anthropic key."}
          </p>
          {filtered && (
            <Link href="/projects/visuals" className="text-sm underline underline-offset-4">
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((visual) => (
            <li key={visual.id} className="flex flex-col gap-2">
              <a href={visual.url} target="_blank" rel="noopener noreferrer" aria-label={`Open full size: ${visual.caption ?? visual.project.name}`}>
                <VisualImage url={visual.url} alt={visual.caption ?? `Screenshot from ${visual.project.name}`} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
              </a>
              <Link href={`/projects/${visual.project.slug}`} className="text-base font-medium underline-offset-4 hover:underline">
                {visual.project.name}
              </Link>
              <p className="text-sm text-soft-foreground">{visual.caption ?? "No caption yet"}</p>
              <p className="flex gap-3 text-sm text-muted-foreground">
                {visual.flow && <span>{tagLabel(catalog.flows, visual.flow)}</span>}
                {visual.figma_link && (
                  <a href={visual.figma_link} target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4">
                    Figma frame<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}

      <DetailSection title={`Figma files on record (${figma.reduce((sum, item) => sum + item.files.length, 0)})`}>
        {figma.length === 0 ? (
          <p className="text-sm text-soft-foreground">No project has a Figma file recorded yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {figma.map(({ project, files }) => (
              <li key={project.id} className="flex flex-col gap-2 rounded-2xl border bg-card p-5 shadow-pulse-soft">
                <Link href={`/projects/${project.slug}`} className="text-lg font-medium underline-offset-4 hover:underline">
                  {project.name}
                </Link>
                <ul className="flex flex-col gap-1 text-sm">
                  {files.map((file) => (
                    <li key={file.url}>
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="underline decoration-border underline-offset-4 transition-colors duration-300 hover:decoration-foreground/40">
                        {file.label}
                        <span className="sr-only"> (opens Figma in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </div>
  );
}
