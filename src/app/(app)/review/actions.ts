"use server";

import { revalidatePath } from "next/cache";
import { idSchema } from "@/schemas/common";
import { requireRole } from "@/server/auth";
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
