import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { TagBadges } from "@/components/tag-badges";
import type { AnswerProject } from "@/schemas/answer";
import { builtInCatalog, tagLabel } from "@/lib/tag-catalog";

// Built-in labels are enough here; a value added in Settings falls back to a readable key.
const BUILT_IN = builtInCatalog();

export function AnswerProjectCard({ project }: { project: AnswerProject }) {
  return (
    <article className="relative flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 shadow-pulse-soft transition-all duration-300 ease-pulse focus-within:-translate-y-0.5 focus-within:shadow-pulse-soft-lg hover:-translate-y-0.5 hover:shadow-pulse-soft-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <p className="text-xs tracking-wide text-pulse-muted uppercase">
        {tagLabel(BUILT_IN.industry, project.industry)}
      </p>
      <h3 className="text-base leading-snug font-medium">
        <Link href={`/projects/${project.slug}`} className="underline-offset-4 hover:underline">
          {project.name}
        </Link>
      </h3>
      <p className="text-sm leading-relaxed text-foreground/70">{project.why}</p>
      <TagBadges list={BUILT_IN.product_types} values={project.product_types} variant="outline" />
      {project.links.length > 0 && (
        <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-sm">
          {project.links.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-foreground/60 transition-colors duration-300 hover:text-foreground"
              >
                {link.label}
                <ExternalLink aria-hidden className="size-3" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
