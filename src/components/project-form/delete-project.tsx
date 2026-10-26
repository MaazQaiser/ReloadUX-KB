"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProjectAction } from "@/app/(app)/projects/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Admin-only. Typing the name is the confirmation step CLAUDE.md asks for before any delete. */
export function DeleteProject({ slug, name }: { slug: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const matches = typed.trim() === name;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!matches) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteProjectAction(slug, typed);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      router.push("/projects");
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="danger-zone" className="flex flex-col gap-4 rounded-2xl border border-destructive/50 p-6">
      <h2 id="danger-zone" className="text-2xl">
        Delete project
      </h2>
      <p className="max-w-2xl text-sm text-soft-foreground">
        Removes {name} from the library, search, Ask answers and the visual library. The record is kept and can be
        restored from the database, but nobody in the app will see it.
      </p>
      {!open ? (
        <div>
          <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
            Delete project…
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex max-w-md flex-col gap-3">
          <Label htmlFor="confirm-delete">
            Type <span className="font-semibold text-foreground">{name}</span> to confirm
          </Label>
          <Input
            id="confirm-delete"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            autoFocus
            aria-describedby={message ? "delete-error" : undefined}
          />
          <div className="flex gap-3">
            <Button type="submit" variant="destructive" disabled={!matches || pending}>
              {pending ? "Deleting…" : "Delete project"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setTyped("");
                setMessage(null);
              }}
            >
              Cancel
            </Button>
          </div>
          {message && (
            <p id="delete-error" role="alert" className="text-sm text-destructive">
              {message}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
