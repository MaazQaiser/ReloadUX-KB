"use client";

import { useActionState } from "react";
import { changeRoleAction, type RoleFormState } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { USER_ROLE } from "@/lib/constants";
import type { UserRole } from "@/schemas/tags";

export function RoleForm({ userId, name, role, isSelf }: { userId: string; name: string; role: UserRole; isSelf: boolean }) {
  const [state, action, pending] = useActionState<RoleFormState, FormData>(changeRoleAction, null);
  const selectId = `role-${userId}`;

  if (isSelf) return <p className="text-sm text-muted-foreground">{USER_ROLE.labels[role]} (you)</p>;

  return (
    <form action={action} className="flex flex-col gap-1.5">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex items-center gap-2">
        <Label htmlFor={selectId} className="sr-only">
          Role for {name}
        </Label>
        <NativeSelect id={selectId} name="role" defaultValue={role} size="sm">
          {USER_ROLE.keys.map((key) => (
            <NativeSelectOption key={key} value={key}>
              {USER_ROLE.labels[key]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save"}
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
