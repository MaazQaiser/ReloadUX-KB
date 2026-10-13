"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { idSchema } from "@/schemas/common";
import { gapResolutionSchema } from "@/schemas/knowledge-gap";
import { requireRole } from "@/server/auth";
import { closeGap, removeVerifiedAnswer, saveVerifiedAnswer } from "@/server/services/learning";
import { approveDraft } from "@/server/services/review";

export type ApproveState = { ok: boolean; message: string } | null;

export async function approveDraftAction(_previous: ApproveState, formData: FormData): Promise<ApproveState> {
  const admin = await requireRole("admin");
  const id = idSchema.safeParse(formData.get("projectId"));
  if (!id.success) return { ok: false, message: "That draft couldn't be read. Reload and try again." };

  const result = await approveDraft(admin, id.data);
  if (!result.ok) return { ok: false, message: "This draft was already approved or removed." };
  revalidatePath("/review");
  revalidatePath("/projects");
  return { ok: true, message: `${result.value.name} is now live.` };
}

const resolveSchema = z.object({
  gapId: idSchema,
  type: gapResolutionSchema,
  note: z.string().trim().max(1000).optional(),
});

export async function resolveGapAction(_previous: ApproveState, formData: FormData): Promise<ApproveState> {
  const admin = await requireRole("admin");
  const input = resolveSchema.safeParse({
    gapId: formData.get("gapId"),
    type: formData.get("type"),
    note: formData.get("note") || undefined,
  });
  if (!input.success) return { ok: false, message: "Pick how it was resolved." };
  const result = await closeGap(admin, input.data.gapId, input.data.type, input.data.note);
  if (!result.ok) return { ok: false, message: "Someone already resolved this one." };
  revalidatePath("/review");
  return { ok: true, message: "Resolved." };
}

export type VerifiedAnswerState = { ok: boolean; message: string; errors?: Record<string, string> } | null;

export async function saveVerifiedAnswerAction(_previous: VerifiedAnswerState, formData: FormData): Promise<VerifiedAnswerState> {
  const admin = await requireRole("admin");
  const id = formData.get("id");
  const parsedId = id ? idSchema.safeParse(id) : null;
  if (parsedId && !parsedId.success) return { ok: false, message: "That answer couldn't be read. Reload and try again." };

  const result = await saveVerifiedAnswer(
    admin,
    {
      question: String(formData.get("question") ?? ""),
      answer: String(formData.get("answer") ?? ""),
      project_slugs: formData.getAll("project_slugs").map(String),
    },
    parsedId?.data,
  );
  if (!result.ok) {
    if (result.error.kind === "invalid") {
      return {
        ok: false,
        message: "Some fields need fixing.",
        errors: Object.fromEntries(result.error.issues.map((issue) => [issue.path.split(".")[0] ?? "form", issue.message])),
      };
    }
    return {
      ok: false,
      message: result.error.kind === "not_found" ? "That answer was removed." : "A linked project no longer exists. Pick again.",
    };
  }
  revalidatePath("/review");
  return { ok: true, message: parsedId ? "Saved." : "Added. The agent will start from it for similar questions." };
}

export async function deleteVerifiedAnswerAction(_previous: ApproveState, formData: FormData): Promise<ApproveState> {
  const admin = await requireRole("admin");
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "That answer couldn't be read." };
  const removed = await removeVerifiedAnswer(admin, id.data);
  revalidatePath("/review");
  return removed ? { ok: true, message: "Removed." } : { ok: false, message: "It was already removed." };
}
