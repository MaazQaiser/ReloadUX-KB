"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { editVisualAction, visualCommandAction } from "@/app/(app)/projects/visual-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { FLOW } from "@/lib/constants";
import type { VisualView } from "@/server/services/visuals";
import { VisualImage } from "./visual-image";

const UPLOAD_ERRORS: Record<string, string> = {
  rate_limited: "Too many uploads this hour. Try again later.",
  forbidden: "Only editors can upload screenshots.",
  invalid_request: "Pick up to 10 images at a time.",
  project_not_found: "This project no longer exists.",
};

function VisualRow({ visual, index, count }: { visual: VisualView; index: number; count: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const id = (field: string) => `visual-${visual.id}-${field}`;

  function run(task: () => Promise<{ ok: boolean; message?: string }>, done?: string) {
    startTransition(async () => {
      try {
        const result = await task();
        setMessage(result.ok ? (done ?? null) : (result.message ?? "That didn't work."));
        if (result.ok) router.refresh();
      } catch {
        setMessage("That didn't work. Try again.");
      }
    });
  }

  function save(form: FormData) {
    run(
      () =>
        editVisualAction({
          id: visual.id,
          caption: String(form.get("caption") ?? ""),
          flow: String(form.get("flow") ?? ""),
          figma_link: String(form.get("figma_link") ?? ""),
        }),
      "Saved.",
    );
  }

  const command = (name: "cover" | "earlier" | "later" | "remove") => () =>
    run(() => visualCommandAction({ id: visual.id, command: name }));

  return (
    <li className="grid gap-5 border-b py-6 md:grid-cols-[16rem_1fr]">
      <div className="flex flex-col gap-2">
        <VisualImage url={visual.url} alt={visual.caption ?? `Screenshot ${index + 1}`} sizes="16rem" />
        {visual.is_cover && <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">Cover image</p>}
      </div>
      <form action={save} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={id("caption")}>Caption (also the alt text)</Label>
          <Input id={id("caption")} name="caption" defaultValue={visual.caption} maxLength={300} placeholder="Mobile onboarding, step 2: choose health goals" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={id("flow")}>Flow</Label>
            <NativeSelect id={id("flow")} name="flow" defaultValue={visual.flow ?? ""} className="w-full">
              <NativeSelectOption value="">Not set</NativeSelectOption>
              {FLOW.keys.map((key) => (
                <NativeSelectOption key={key} value={key}>
                  {FLOW.labels[key]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={id("figma")}>Figma frame link</Label>
            <Input id={id("figma")} name="figma_link" type="url" defaultValue={visual.figma_link} placeholder="https://www.figma.com/design/…" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={pending}>Save</Button>
          {!visual.is_cover && (
            <Button type="button" size="sm" variant="outline" disabled={pending} onClick={command("cover")}>Make cover</Button>
          )}
          <Button type="button" size="sm" variant="ghost" disabled={pending || index === 0} onClick={command("earlier")} aria-label={`Move screenshot ${index + 1} earlier`}>Move up</Button>
          <Button type="button" size="sm" variant="ghost" disabled={pending || index === count - 1} onClick={command("later")} aria-label={`Move screenshot ${index + 1} later`}>Move down</Button>
          {confirming ? (
            <>
              <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={command("remove")}>Yes, remove</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>Keep it</Button>
            </>
          ) : (
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(true)}>Remove</Button>
          )}
        </div>
        <p role="status" className="min-h-5 text-sm text-muted-foreground">{message}</p>
      </form>
    </li>
  );
}

export function VisualsManager({ slug, visuals }: { slug: string; visuals: VisualView[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState<string[]>([]);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setReport([]);
    const body = new FormData();
    body.set("slug", slug);
    for (const file of Array.from(files).slice(0, 10)) body.append("files", file);
    try {
      const response = await fetch("/api/visuals", { method: "POST", body });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const code = typeof data === "object" && data !== null && "error" in data ? String(data.error) : "";
        setReport([UPLOAD_ERRORS[code] ?? "Upload failed. Try again."]);
      } else if (typeof data === "object" && data !== null && "outcomes" in data && Array.isArray(data.outcomes)) {
        const outcomes = data.outcomes as { name: string; ok: boolean; reason?: string }[];
        const added = outcomes.filter((outcome) => outcome.ok).length;
        setReport([
          `${added} of ${outcomes.length} added.`,
          ...outcomes.filter((outcome) => !outcome.ok).map((outcome) => `${outcome.name} ${outcome.reason}.`),
        ]);
        router.refresh();
      }
    } catch {
      setReport(["Upload failed. Check your connection and try again."]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section aria-labelledby="visuals-heading" className="grid gap-6 border-t pt-8 lg:grid-cols-[14rem_1fr]">
      <h2 id="visuals-heading" className="text-2xl">Visuals</h2>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 border border-dashed p-6">
          <Label htmlFor="visual-upload">Add screenshots</Label>
          <p id="visual-upload-hint" className="text-sm text-muted-foreground">
            3 to 8 final screens is plenty. PNG, JPG or WebP, up to 10 MB each, 10 at a time.
          </p>
          <Input
            ref={inputRef}
            id="visual-upload"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            disabled={uploading}
            aria-describedby="visual-upload-hint"
            onChange={(event) => void upload(event.target.files)}
          />
          <div role="status" aria-live="polite" className="text-sm text-soft-foreground">
            {uploading ? "Uploading…" : report.map((line) => <p key={line}>{line}</p>)}
          </div>
        </div>
        {visuals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No screenshots yet.</p>
        ) : (
          <ol className="flex flex-col border-t">
            {visuals.map((visual, index) => (
              <VisualRow key={visual.id} visual={visual} index={index} count={visuals.length} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
