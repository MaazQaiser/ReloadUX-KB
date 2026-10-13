"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { PreviewBadge } from "@/components/preview-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { countSuggested, MAX_FILL_TEXT_LENGTH, suggestFromText, type FillSuggestion } from "@/lib/fill-from-text";
import type { TagCatalog } from "@/lib/tag-catalog";

/**
 * Paste a brief, proposal or case study to pre-fill the form for review.
 * Preview: matches tag names, Figma links and the opening sentences in the
 * browser; Claude takes over once the API key is set up.
 */
export function FillFromText({ catalog, onApply }: { catalog: TagCatalog; onApply: (suggestion: FillSuggestion) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);

  function fill() {
    const suggestion = suggestFromText(text, catalog);
    const count = countSuggested(suggestion);
    if (count === 0) {
      setResult("Nothing recognisable found. Try text that names the industry, product type or services.");
      return;
    }
    onApply(suggestion);
    setResult(`Filled ${count} ${count === 1 ? "field" : "fields"} that were empty. Check them before saving.`);
    setText("");
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-4 border border-dashed p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="font-medium">Fill from text</p>
          <p className="text-sm text-soft-foreground">
            Paste a brief, proposal or case study and the matching fields are filled in. Nothing is saved until you
            press save, and fields you already filled are left alone.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PreviewBadge />
          {!open && (
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>
              <Sparkles aria-hidden />
              Fill from text
            </Button>
          )}
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-3">
          <Label htmlFor="fill-from-text">Text to read</Label>
          <Textarea
            id="fill-from-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={MAX_FILL_TEXT_LENGTH}
            rows={6}
            autoFocus
            placeholder="We designed a mobile app iOS for a fintech client: research, UX/UI design and AI onboarding…"
          />
          <p className="text-xs text-muted-foreground">
            Preview: picks up industry, product types, services, AI features, flows, Figma links and a summary only
            where the text names them.
          </p>
          <div className="flex gap-3">
            <Button type="button" onClick={fill} disabled={!text.trim()}>
              Fill fields
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {result && (
        <p role="status" className="text-sm text-soft-foreground">
          {result}
        </p>
      )}
    </div>
  );
}
