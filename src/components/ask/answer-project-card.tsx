import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { TagBadges } from "@/components/tag-badges";
import type { AnswerProject } from "@/schemas/answer";
import { builtInCatalog, tagLabel } from "@/lib/tag-catalog";

// Built-in labels are enough here; a value added in Settings falls back to a readable key.
const BUILT_IN = builtInCatalog();

export function AnswerProjectCard({ project }: { project: AnswerProject }) {
  return (
    <article className="rx-hover-wash flex h-full flex-col gap-3 border border-white/15 bg-card p-5 transition-[border-color] duration-400 focus-within:border-transparent hover:border-transparent">
      <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
        {tagLabel(BUILT_IN.industry, project.industry)}
      </p>
      <h3 className="font-heading text-xl leading-snug">
        <Link href={`/projects/${project.slug}`} className="underline-offset-4 hover:underline">
          {project.name}
        </Link>
      </h3>
      <p className="text-sm text-soft-foreground">{project.why}</p>
      <TagBadges list={BUILT_IN.product_types} values={project.product_types} variant="outline" />
      {project.links.length > 0 && (
        <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-sm">
          {project.links.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
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
