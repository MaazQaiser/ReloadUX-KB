"use client";

import { useActionState } from "react";
import { changeRoleAction, type RoleFormState } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";

/** One click for the common case: let a waiting person in as a viewer. */
export function ApproveForm({ userId, name }: { userId: string; name: string }) {
  const [state, action, pending] = useActionState<RoleFormState, FormData>(changeRoleAction, null);
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="role" value="viewer" />
      <Button type="submit" size="sm" disabled={pending} aria-label={`Approve ${name} as a viewer`}>
        {pending ? "Approving…" : "Approve as viewer"}
      </Button>
      {state && !state.ok && (
        <p role="status" className="text-xs text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
