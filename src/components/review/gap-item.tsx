"use client";

import { useActionState } from "react";
import { resolveGapAction, type ApproveState } from "@/app/(app)/projects/review-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { GAP_RESOLUTIONS, type KnowledgeGap } from "@/schemas/knowledge-gap";

const REASON_LABELS: Record<KnowledgeGap["reason"], string> = {
  thumbs_down: "Thumbs down",
  not_recorded: "Field not recorded",
  low_confidence_no: "Unsure No",
  rephrased: "Asked again",
};

const RESOLUTION_LABELS: Record<(typeof GAP_RESOLUTIONS)[number], string> = {
  fixed_record: "Fixed a project record",
  added_project: "Added a missing project",
  added_tag: "Added a tag value",
  verified_answer: "Wrote a verified answer",
  dismissed: "Not a real gap",
};

export function GapItem({ gap }: { gap: Pick<KnowledgeGap, "id" | "question" | "reason" | "note"> & { asked: string } }) {
  const [state, action, pending] = useActionState<ApproveState, FormData>(resolveGapAction, null);
  const typeId = `gap-type-${gap.id}`;
  const noteId = `gap-note-${gap.id}`;

  return (
    <li className="flex flex-col gap-4 border-b py-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex max-w-2xl flex-col gap-1">
        <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
          {REASON_LABELS[gap.reason]} · {gap.asked}
        </p>
        <p className="text-lg font-medium">“{gap.question}”</p>
        {gap.note && <p className="text-sm text-soft-foreground">What was wrong: {gap.note}</p>}
      </div>
      <form action={action} className="flex shrink-0 flex-col gap-2 lg:w-80">
        <input type="hidden" name="gapId" value={gap.id} />
        <Label htmlFor={typeId}>Resolved by</Label>
        <NativeSelect id={typeId} name="type" defaultValue="fixed_record" className="w-full">
          {GAP_RESOLUTIONS.map((type) => (
            <NativeSelectOption key={type} value={type}>
              {RESOLUTION_LABELS[type]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Label htmlFor={noteId}>Note (optional)</Label>
        <Input id={noteId} name="note" maxLength={1000} />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Mark resolved"}
        </Button>
        {state && (
          <p role="status" className={state.ok ? "text-xs text-muted-foreground" : "text-xs text-destructive"}>
            {state.message}
          </p>
        )}
      </form>
    </li>
  );
}
