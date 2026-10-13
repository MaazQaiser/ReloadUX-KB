"use client";

import { useActionState, useRef } from "react";
import { addTagValueAction, type RoleFormState } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TagListName } from "@/lib/constants";

export function AddTagForm({ list, title }: { list: TagListName; title: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<RoleFormState, FormData>(async (previous, formData) => {
    const result = await addTagValueAction(previous, formData);
    if (result?.ok) formRef.current?.reset();
    return result;
  }, null);
  const inputId = `add-tag-${list}`;

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-1">
      <input type="hidden" name="list" value={list} />
      <div className="flex items-center gap-2">
        <Label htmlFor={inputId} className="sr-only">
          New {title.toLowerCase()} value
        </Label>
        <Input id={inputId} name="label" maxLength={60} placeholder={`Add to ${title.toLowerCase()}`} className="h-8 max-w-56" />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </Button>
      </div>
      {state && (
        <p role="status" className={state.ok ? "text-xs text-muted-foreground" : "text-xs text-destructive"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
