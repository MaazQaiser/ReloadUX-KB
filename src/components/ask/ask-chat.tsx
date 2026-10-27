"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Square } from "lucide-react";
import { PreviewBadge } from "@/components/preview-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_QUESTION_LENGTH } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AnswerTurn } from "./answer-turn";
import { ProjectPanel } from "./project-panel";
import { useAsk } from "./use-ask";

/**
 * `name` is the signed-in person's first name, for the welcome; it may be missing.
 * `preview` marks canned answers (no Claude key yet), so nobody trusts them.
 */
export function AskChat({ starters, name, preview }: { starters: readonly string[]; name?: string; preview: boolean }) {
  const { turns, ask, stop, busy } = useAsk();
  const [question, setQuestion] = useState("");
  const [focused, setFocused] = useState(false);
  const [openProject, setOpenProject] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastState = turns.at(-1)?.state;
  const expanded = focused || question.trim() !== "" || busy;

  // Follow the newest turn as it grows, and hand focus back to the box when it ends.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [turns]);
  useEffect(() => {
    if (lastState && lastState !== "streaming") inputRef.current?.focus();
  }, [lastState]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setQuestion("");
    void ask(trimmed);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(question);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter adds a line; IME composition must not send half a word.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(question);
    }
  }

  return (
    // Pulse's single 840px column; the bottom padding keeps the last answer clear of the floating composer.
    <div className="mx-auto flex w-full max-w-[52.5rem] flex-1 flex-col gap-8 pb-40">
      {turns.length === 0 ? (
        // The welcome fills the space above the composer until the first question.
        <section
          aria-labelledby="ask-welcome"
          className="flex flex-1 animate-in flex-col justify-center gap-10 py-6 duration-500 ease-pulse fade-in-0 slide-in-from-bottom-5 sm:py-12 motion-reduce:animate-none"
        >
          <div className="flex flex-col items-start gap-4">
            {preview && <PreviewBadge />}
            <h1 id="ask-welcome" className="font-heading text-3xl leading-tight italic sm:text-4xl md:text-5xl">
              {name ? (
                <>
                  Hey <span className="rx-gradient-text pr-1">{name}</span>, I&apos;m here to help.
                </>
              ) : (
                "Hi, I'm here to help."
              )}
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-foreground/60">
              Tell me what you&apos;re looking for and I&apos;ll find the relevant work.
            </p>
          </div>
          {/* One swipeable row on phones so the suggestions stay above the composer; wrapped from sm up. */}
          <ul
            aria-label="Suggestions"
            className="-mx-4 flex w-[calc(100%+2rem)] max-w-none snap-x scroll-px-4 gap-2 overflow-x-auto px-4 py-2 sm:mx-0 sm:w-auto sm:flex-wrap sm:overflow-visible sm:px-0"
          >
            {starters.map((starter) => (
              <li key={starter} className="shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => send(starter)}
                  className="rounded-full border bg-background px-3.5 py-1.5 text-sm whitespace-nowrap text-foreground/70 transition-all duration-300 ease-pulse outline-none hover:-translate-y-0.5 hover:bg-muted hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/15 active:scale-95 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  {starter}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <h1 className="sr-only">Ask about projects</h1>
          <ol className="flex flex-col gap-8" aria-label="Conversation">
            {turns.map((turn) => (
              <AnswerTurn key={turn.key} turn={turn} onOpenProject={setOpenProject} />
            ))}
          </ol>
        </>
      )}

      <ProjectPanel slug={openProject} onClose={() => setOpenProject(null)} />

      <p role="status" className="sr-only">
        {lastState === "done" ? "Answer ready." : ""}
      </p>
      <div ref={endRef} />

      {/* Pulse's floating glass composer; only the shell takes clicks so the page stays scrollable around it. */}
      <form
        onSubmit={onSubmit}
        className="pointer-events-none fixed inset-x-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-30 flex flex-col items-center gap-2 px-4 sm:px-6"
      >
        <Label htmlFor="ask-question" className="sr-only">
          Ask about past projects
        </Label>
        {/* Compact until someone clicks in, types or is waiting on an answer; then it opens up. */}
        <div
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
          }}
          className={cn(
            "glow-stroke pointer-events-auto w-full rounded-[1.75rem] border bg-background/50 backdrop-blur-xl transition-[max-width,padding,box-shadow] duration-300 ease-pulse motion-reduce:transition-none",
            expanded ? "max-w-[44.1rem] p-3 sm:p-4" : "max-w-md p-1.5",
          )}
        >
          <div className="flex items-end gap-2 rounded-3xl border bg-muted p-1.5 transition-colors duration-300 focus-within:border-foreground/25">
            <Textarea
              ref={inputRef}
              id="ask-question"
              value={question}
              maxLength={MAX_QUESTION_LENGTH}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={busy ? "Working on it…" : expanded ? "Have we done a healthcare chatbot?" : "Ask about past projects…"}
              aria-describedby="ask-hint"
              className="max-h-48 min-h-10 resize-none rounded-none border-0 bg-transparent px-3 py-2.5 text-sm hover:bg-transparent focus-visible:ring-0 md:text-sm"
              rows={1}
            />
            {busy ? (
              <Button type="button" size="icon" onClick={stop} aria-label="Stop" className={SEND_BUTTON}>
                <Square aria-hidden className="size-3.5 fill-current" />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!question.trim()} aria-label="Ask" className={SEND_BUTTON}>
                <ArrowUp aria-hidden strokeWidth={2} />
              </Button>
            )}
          </div>
        </div>
        <p id="ask-hint" className={cn("pointer-events-auto text-xs text-pulse-muted", !expanded && "sr-only")}>
          Enter to send, Shift+Enter for a new line.
        </p>
      </form>
    </div>
  );
}

// Pulse's round ink send: grows a little on hover and presses in, instead of the usual lift.
const SEND_BUTTON = "shadow-none hover:translate-y-0 hover:scale-105 hover:shadow-pulse-soft active:scale-90";
