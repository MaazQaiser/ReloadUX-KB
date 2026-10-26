"use client";

import { useActionState } from "react";
import { saveVerifiedAnswerAction, type VerifiedAnswerState } from "@/app/(app)/projects/review-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  projects: { slug: string; name: string }[];
  initial?: { id: string; question: string; answer: string; project_slugs: string[] };
  onDone?: () => void;
}

export function VerifiedAnswerForm({ projects, initial, onDone }: Props) {
  const [state, action, pending] = useActionState<VerifiedAnswerState, FormData>(async (previous, formData) => {
    const result = await saveVerifiedAnswerAction(previous, formData);
    if (result?.ok) onDone?.();
    return result;
  }, null);
  const prefix = initial ? `va-${initial.id}` : "va-new";
  const error = (field: string) => state?.errors?.[field];

  return (
    <form action={action} className="flex flex-col gap-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-question`}>Question</Label>
        <Textarea
          id={`${prefix}-question`}
          name="question"
          rows={2}
          defaultValue={initial?.question}
          placeholder="Have we done a healthcare chatbot?"
          aria-invalid={error("question") ? true : undefined}
          aria-describedby={error("question") ? `${prefix}-question-error` : undefined}
        />
        {error("question") && (
          <p id={`${prefix}-question-error`} className="text-sm text-destructive">
            {error("question")}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-answer`}>Approved answer</Label>
        <Textarea
          id={`${prefix}-answer`}
          name="answer"
          rows={4}
          defaultValue={initial?.answer}
          aria-invalid={error("answer") ? true : undefined}
          aria-describedby={error("answer") ? `${prefix}-answer-error` : undefined}
        />
        {error("answer") && (
          <p id={`${prefix}-answer-error`} className="text-sm text-destructive">
            {error("answer")}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-projects`}>Projects it refers to</Label>
        <select
          id={`${prefix}-projects`}
          name="project_slugs"
          multiple
          defaultValue={initial?.project_slugs}
          size={Math.min(8, Math.max(3, projects.length))}
          className="rounded-2xl border bg-transparent p-1.5 text-sm outline-none focus-visible:border-foreground/40 focus-visible:ring-4 focus-visible:ring-ring/10"
          aria-describedby={`${prefix}-projects-hint`}
        >
          {projects.map((project) => (
            <option key={project.slug} value={project.slug} className="px-2 py-1">
              {project.name}
            </option>
          ))}
        </select>
        <p id={`${prefix}-projects-hint`} className="text-xs text-muted-foreground">
          Hold Cmd (Mac) or Ctrl to pick several.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : initial ? "Save answer" : "Add verified answer"}
        </Button>
        {state && (
          <p role="status" className={state.ok ? "text-sm text-muted-foreground" : "text-sm text-destructive"}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
