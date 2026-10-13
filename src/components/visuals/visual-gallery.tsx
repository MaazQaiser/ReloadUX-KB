import { tagLabel, type CatalogList } from "@/lib/tag-catalog";
import type { VisualView } from "@/server/services/visuals";
import { VisualImage } from "./visual-image";

/** Read-only gallery for the project page; cover first, then the editor's order. */
export function VisualGallery({ visuals, projectName, flows }: { visuals: VisualView[]; projectName: string; flows: CatalogList }) {
  const ordered = [...visuals.filter((visual) => visual.is_cover), ...visuals.filter((visual) => !visual.is_cover)];
  return (
    <ul className="grid gap-6 sm:grid-cols-2">
      {ordered.map((visual) => (
        <li key={visual.id} className="flex flex-col gap-2">
          <a href={visual.url} target="_blank" rel="noopener noreferrer" aria-label={`Open full size: ${visual.caption ?? projectName}`}>
            <VisualImage url={visual.url} alt={visual.caption ?? `Screenshot from ${projectName}`} sizes="(min-width: 640px) 50vw, 100vw" />
          </a>
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <p className="text-soft-foreground">{visual.caption ?? "No caption yet"}</p>
            <p className="flex gap-3 text-muted-foreground">
              {visual.flow && <span>{tagLabel(flows, visual.flow)}</span>}
              {visual.figma_link && (
                <a href={visual.figma_link} target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4">
                  Figma frame<span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
