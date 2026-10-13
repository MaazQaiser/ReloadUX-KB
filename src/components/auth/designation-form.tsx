"use client";

import { useActionState } from "react";
import { saveDesignationAction, type ProfileState } from "@/app/(app)/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DesignationForm({ designation }: { designation?: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveDesignationAction, null);
  return (
    <form action={action} className="flex flex-col gap-2">
      <Label htmlFor="designation">Designation</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="designation"
          name="designation"
          defaultValue={designation}
          maxLength={80}
          placeholder="e.g. Lead Product Designer"
          aria-describedby="designation-hint"
          className="sm:max-w-sm"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      <p id="designation-hint" className="text-xs text-muted-foreground">
        Shown under your name in the header. Leave it empty to show your role instead.
      </p>
      {state && (
        <p role="status" className={state.ok ? "text-sm text-soft-foreground" : "text-sm text-destructive"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
