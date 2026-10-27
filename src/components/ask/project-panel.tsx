"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getProjectBriefAction } from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatWeeks } from "@/lib/format";
import type { ProjectBrief } from "@/server/services/project-brief";

type Load = { state: "loading" } | { state: "ready"; brief: ProjectBrief } | { state: "error"; message: string };

/**
 * The project behind an answer card, in a side panel so the conversation stays
 * put. Details load when a card is opened and are kept for the rest of the visit.
 */
export function ProjectPanel({ slug, onClose }: { slug: string | null; onClose: () => void }) {
  const [loads, setLoads] = useState<Record<string, Load>>({});
  const requested = useRef(new Set<string>());
  // The panel opens from a card button, not a Radix trigger, so it has to hand focus back itself.
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!slug || requested.current.has(slug)) return;
    requested.current.add(slug);
    setLoads((current) => ({ ...current, [slug]: { state: "loading" } }));
    getProjectBriefAction(slug)
      .then((result) => {
        setLoads((current) => ({
          ...current,
          [slug]: result.ok ? { state: "ready", brief: result.brief } : { state: "error", message: result.message },
        }));
        // A failed load can be retried by opening the card again.
        if (!result.ok) requested.current.delete(slug);
      })
      .catch(() => {
        requested.current.delete(slug);
        setLoads((current) => ({ ...current, [slug]: { state: "error", message: "The project couldn't be loaded. Try again in a moment." } }));
      });
  }, [slug]);

  const load: Load = (slug && loads[slug]) || { state: "loading" };

  return (
    <Sheet open={slug !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="sm:max-w-lg"
        // Runs just before focus moves into the panel, while the card button still has it.
        onOpenAutoFocus={() => {
          opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          if (!opener.current?.isConnected) return;
          event.preventDefault();
          opener.current.focus();
        }}
      >
        {load.state === "ready" ? (
          <BriefView brief={load.brief} />
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>{load.state === "error" ? "Project unavailable" : "Loading project…"}</SheetTitle>
              <SheetDescription>{load.state === "error" ? load.message : "Fetching the record."}</SheetDescription>
            </SheetHeader>
            {load.state === "loading" && (
              <div className="flex flex-col gap-4 p-6" aria-hidden>
                <Skeleton className="aspect-[16/10] w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function BriefView({ brief }: { brief: ProjectBrief }) {
  const [cover, ...screens] = brief.screens;
  const timeline = [
    ["Started", brief.start_date && formatDate(brief.start_date)],
    ["Delivered", brief.delivery_date && formatDate(brief.delivery_date)],
    ["Duration", brief.duration_weeks && formatWeeks(brief.duration_weeks)],
  ] as const;

  return (
    <>
      <SheetHeader className="gap-3">
        <p className="text-[11px] font-bold tracking-[0.16em] text-pulse-accent uppercase">
          {brief.industry} · {brief.status}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <SheetTitle className="text-2xl">{brief.name}</SheetTitle>
          {brief.nda && <Badge variant="outline">NDA</Badge>}
        </div>
        <SheetDescription>
          {brief.client_name ?? "Client not recorded"}
          {brief.country && ` · ${brief.country}`}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-7 overflow-y-auto p-6">
        {cover && <Screen url={cover.url} caption={cover.caption} name={brief.name} large />}

        <p className="text-sm leading-relaxed">{brief.summary}</p>

        <Group title="What it is">
          <Facts
            rows={[
              ["Type", brief.product_types],
              ["Business model", brief.business_model],
              ["AI", brief.ai_features],
              ["Flows", brief.flows],
              ["Services", brief.services],
            ]}
          />
        </Group>

        <Group title="Personas">
          {brief.personas.length > 0 ? (
            <ul className="flex flex-col gap-1.5 text-sm">
              {brief.personas.map((persona) => (
                <li key={persona} className="rounded-xl bg-muted px-3 py-2">
                  {persona}
                </li>
              ))}
            </ul>
          ) : (
            <NotRecorded />
          )}
        </Group>

        <Group title="Who worked on it">
          <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
            <Row label="Lead designer">{brief.lead_designer}</Row>
            <Row label="Designers">{brief.designers.length > 0 ? brief.designers.join(", ") : undefined}</Row>
            <Row label="Account manager">{brief.account_manager}</Row>
            <Row label="Delivered to">{brief.delivered_to}</Row>
          </dl>
        </Group>

        <Group title="Timeline">
          <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
            {timeline.map(([label, value]) => (
              <Row key={label} label={label}>
                {value || undefined}
              </Row>
            ))}
          </dl>
        </Group>

        {(brief.what_we_did || brief.outcomes) && (
          <Group title="The work">
            <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground/80">
              {brief.what_we_did && <p>{brief.what_we_did}</p>}
              {brief.outcomes && <p>{brief.outcomes}</p>}
            </div>
          </Group>
        )}

        <Group title="Links">
          {brief.links.length > 0 ? (
            <ul className="flex flex-col gap-1.5 text-sm">
              {brief.links.map(({ group, link }) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-foreground/80 underline decoration-border underline-offset-4 transition-colors duration-300 hover:text-foreground hover:decoration-foreground/40"
                  >
                    <span className="text-pulse-muted">{group}:</span> {link.label}
                    <ExternalLink aria-hidden className="size-3" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <NotRecorded />
          )}
        </Group>

        {screens.length > 0 && (
          <Group title="More screens">
            <ul className="grid grid-cols-2 gap-3">
              {screens.map((screen) => (
                <li key={screen.url}>
                  <Screen url={screen.url} caption={screen.caption} name={brief.name} />
                </li>
              ))}
            </ul>
          </Group>
        )}
      </div>

      <SheetFooter>
        <Link href={`/projects/${brief.slug}`} className={buttonVariants({ className: "w-full font-bold sm:w-auto" })}>
          Open full record
          <ArrowUpRight aria-hidden />
        </Link>
      </SheetFooter>
    </>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs tracking-wide text-pulse-muted uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Facts({ rows }: { rows: [string, string[]][] }) {
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2.5 text-sm">
      {rows.map(([label, values]) => (
        <Row key={label} label={label}>
          {values.length > 0 ? (
            <span className="flex flex-wrap gap-1.5">
              {values.map((value) => (
                <Badge key={value} variant="outline">
                  {value}
                </Badge>
              ))}
            </span>
          ) : undefined}
        </Row>
      ))}
    </dl>
  );
}

function Row({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <>
      <dt className="text-foreground/60">{label}</dt>
      <dd className="min-w-0">{children ?? <NotRecorded />}</dd>
    </>
  );
}

/** The spec's rule for gaps: say so plainly rather than leave a blank or guess. */
function NotRecorded() {
  return <span className="text-sm text-pulse-muted italic">not recorded</span>;
}

function Screen({ url, caption, name, large = false }: { url: string; caption?: string; name: string; large?: boolean }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block cursor-zoom-in rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-ring/15">
      <span className={`relative block overflow-hidden rounded-xl border bg-muted shadow-pulse-soft ${large ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
        <Image src={url} alt={caption ?? `Screenshot from ${name}`} fill sizes={large ? "512px" : "240px"} unoptimized className="object-cover object-top" />
      </span>
      <span className="sr-only">Open full size (new tab)</span>
    </a>
  );
}
