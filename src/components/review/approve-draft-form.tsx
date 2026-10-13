"use client";

import { useActionState } from "react";
import { approveDraftAction, type ApproveState } from "@/app/(app)/projects/review-actions";
import { Button } from "@/components/ui/button";

export function ApproveDraftForm({ projectId, name }: { projectId: string; name: string }) {
  const [state, action, pending] = useActionState<ApproveState, FormData>(approveDraftAction, null);
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="projectId" value={projectId} />
      <Button type="submit" disabled={pending} aria-label={`Approve ${name} as it is`}>
        {pending ? "Approving…" : "Approve as is"}
      </Button>
      {state && (
        <p role="status" className={state.ok ? "text-xs text-muted-foreground" : "text-xs text-destructive"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
