"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { deleteVerifiedAnswerAction, type ApproveState } from "@/app/(app)/projects/review-actions";
import { Button } from "@/components/ui/button";
import { VerifiedAnswerForm } from "./verified-answer-form";

interface Props {
  answer: { id: string; question: string; answer: string; project_slugs: string[]; updated: string };
  projects: { slug: string; name: string }[];
}

export function VerifiedAnswerItem({ answer, projects }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [state, remove, removing] = useActionState<ApproveState, FormData>(deleteVerifiedAnswerAction, null);
  const nameOf = new Map(projects.map((project) => [project.slug, project.name]));

  if (editing) {
    return (
      <li className="border-b py-5">
        <VerifiedAnswerForm projects={projects} initial={answer} onDone={() => setEditing(false)} />
        <Button variant="link" className="mt-2 px-0" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 border-b py-5">
      <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">Updated {answer.updated}</p>
      <p className="font-heading text-xl">“{answer.question}”</p>
      <p className="max-w-3xl whitespace-pre-line text-soft-foreground">{answer.answer}</p>
      {answer.project_slugs.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Projects:{" "}
          {answer.project_slugs.map((slug, index) => (
            <span key={slug}>
              {index > 0 && ", "}
              <Link href={`/projects/${slug}`} className="text-foreground underline underline-offset-4">
                {nameOf.get(slug) ?? slug}
              </Link>
            </span>
          ))}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        {confirming ? (
          <form action={remove} className="flex items-center gap-2">
            <input type="hidden" name="id" value={answer.id} />
            <span className="text-sm text-soft-foreground">The agent will stop using it.</span>
            <Button type="submit" size="sm" variant="destructive" disabled={removing}>
              {removing ? "Removing…" : "Yes, remove"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
          </form>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
            Remove
          </Button>
        )}
        {state && !state.ok && (
          <p role="status" className="text-sm text-destructive">
            {state.message}
          </p>
        )}
      </div>
    </li>
  );
}
