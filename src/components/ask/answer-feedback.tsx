"use client";

import { useState, useTransition } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { submitAnswerFeedbackAction } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_FEEDBACK_NOTE_LENGTH } from "@/lib/constants";

type Rating = "up" | "down";

export function AnswerFeedback({ turnId }: { turnId: string }) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const noteId = `feedback-note-${turnId}`;

  function send(chosen: Rating, withNote?: string) {
    setError(null);
    startTransition(async () => {
      const result = await submitAnswerFeedbackAction({ turn_id: turnId, rating: chosen, note: withNote || undefined });
      if (result.ok) setSent(true);
      else setError(result.message);
    });
  }

  function choose(chosen: Rating) {
    setRating(chosen);
    setSent(false);
    // A thumbs down asks what was wrong first; a thumbs up is sent straight away.
    if (chosen === "up") send("up");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2" role="group" aria-label="Was this answer useful?">
        <span className="text-sm text-muted-foreground">Useful?</span>
        <Button
          type="button"
          variant={rating === "up" ? "secondary" : "ghost"}
          size="icon-sm"
          aria-pressed={rating === "up"}
          aria-label="Yes, useful"
          disabled={pending}
          onClick={() => choose("up")}
        >
          <ThumbsUp aria-hidden />
        </Button>
        <Button
          type="button"
          variant={rating === "down" ? "secondary" : "ghost"}
          size="icon-sm"
          aria-pressed={rating === "down"}
          aria-label="No, not useful"
          disabled={pending}
          onClick={() => choose("down")}
        >
          <ThumbsDown aria-hidden />
        </Button>
        {sent && (
          <span role="status" className="text-sm text-muted-foreground">
            Thanks for the feedback.
          </span>
        )}
      </div>

      {rating === "down" && !sent && (
        <form
          className="flex max-w-xl flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            send("down", note.trim());
          }}
        >
          <Label htmlFor={noteId}>What was wrong? (optional)</Label>
          <Textarea
            id={noteId}
            value={note}
            maxLength={MAX_FEEDBACK_NOTE_LENGTH}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Wrong project, missing a project, out-of-date details…"
          />
          <div>
            <Button type="submit" size="sm" disabled={pending}>
              Send feedback
            </Button>
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
