import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { TagBadges } from "@/components/tag-badges";
import type { AnswerProject } from "@/schemas/answer";
import { builtInCatalog, tagLabel } from "@/lib/tag-catalog";

// Built-in labels are enough here; a value added in Settings falls back to a readable key.
const BUILT_IN = builtInCatalog();

/** A matching project in an answer. The whole card opens the project panel; its links still work on their own. */
export function AnswerProjectCard({ project, onOpen }: { project: AnswerProject; onOpen: (slug: string) => void }) {
  return (
    <article className="relative flex h-full flex-col gap-3 rounded-2xl border bg-card p-3 pb-5 shadow-pulse-soft transition-all duration-300 ease-pulse focus-within:-translate-y-0.5 focus-within:shadow-pulse-soft-lg hover:-translate-y-0.5 hover:shadow-pulse-soft-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {project.cover_url && (
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl border bg-muted">
          {/* Our auth-checked file route; Next's optimiser fetches anonymously, so it's skipped. */}
          <Image src={project.cover_url} alt="" fill sizes="(min-width: 640px) 400px, 100vw" unoptimized className="object-cover object-top" />
        </div>
      )}
      <div className="flex flex-col gap-3 px-2">
        <p className="text-xs tracking-wide text-pulse-muted uppercase">{tagLabel(BUILT_IN.industry, project.industry)}</p>
        <h3 className="text-base leading-snug font-medium">
          {/* The stretched button makes the whole card open the panel with one tab stop. */}
          <button
            type="button"
            onClick={() => onOpen(project.slug)}
            aria-haspopup="dialog"
            className="text-left after:absolute after:inset-0 after:rounded-2xl focus:outline-none focus-visible:after:ring-4 focus-visible:after:ring-ring/15"
          >
            {project.name}
            <span className="sr-only">: show project details</span>
          </button>
        </h3>
        <p className="text-sm leading-relaxed text-foreground/70">{project.why}</p>
        <TagBadges list={BUILT_IN.product_types} values={project.product_types} variant="outline" />
        {project.links.length > 0 && (
          <ul className="relative z-10 mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-sm">
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
      </div>
    </article>
  );
}
