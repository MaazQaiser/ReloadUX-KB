"use server";

import { z } from "zod";
import { idSchema } from "@/schemas/common";
import { requireRole } from "@/server/auth";
import { editVisual, runVisualCommand } from "@/server/services/visuals";

export type VisualActionResult = { ok: true } | { ok: false; message: string };

const editSchema = z.object({
  id: idSchema,
  caption: z.string().optional(),
  flow: z.string().optional(),
  figma_link: z.string().optional(),
});

/** Blank inputs mean "not set". */
const blankToUndefined = (value: string | undefined) => (value?.trim() ? value.trim() : undefined);

export async function editVisualAction(raw: unknown): Promise<VisualActionResult> {
  const editor = await requireRole("editor");
  const input = editSchema.safeParse(raw);
  if (!input.success) return { ok: false, message: "That screenshot couldn't be read. Reload and try again." };

  const result = await editVisual(editor, input.data.id, {
    caption: blankToUndefined(input.data.caption),
    flow: blankToUndefined(input.data.flow),
    figma_link: blankToUndefined(input.data.figma_link),
  });
  if (result.ok) return { ok: true };
  return {
    ok: false,
    message: result.error.kind === "not_found" ? "This screenshot was removed." : "Check the Figma link: it must start with https://.",
  };
}

const commandSchema = z.object({ id: idSchema, command: z.enum(["cover", "earlier", "later", "remove"]) });

export async function visualCommandAction(raw: unknown): Promise<VisualActionResult> {
  const editor = await requireRole("editor");
  const input = commandSchema.safeParse(raw);
  if (!input.success) return { ok: false, message: "That didn't work. Reload and try again." };
  const result = await runVisualCommand(editor, input.data.id, input.data.command);
  return result.ok ? { ok: true } : { ok: false, message: "This screenshot was removed." };
}
