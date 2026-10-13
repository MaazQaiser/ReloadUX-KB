"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { USER_ROLE } from "@/lib/constants";
import { idSchema } from "@/schemas/common";
import { userRoleSchema } from "@/schemas/tags";
import { requireRole } from "@/server/auth";
import { changeUserRole } from "@/server/services/users";

export type RoleFormState = { ok: boolean; message: string } | null;

const roleChangeSchema = z.object({ userId: idSchema, role: userRoleSchema });

export async function changeRoleAction(_previous: RoleFormState, formData: FormData): Promise<RoleFormState> {
  const admin = await requireRole("admin");
  const input = roleChangeSchema.safeParse({ userId: formData.get("userId"), role: formData.get("role") });
  if (!input.success) return { ok: false, message: "Pick a role from the list." };

  const result = await changeUserRole(admin, input.data.userId, input.data.role);
  if (!result.ok) {
    return {
      ok: false,
      message: result.error === "own_role" ? "You can't change your own role." : "That person no longer exists.",
    };
  }
  revalidatePath("/settings");
  return { ok: true, message: `Saved: ${result.value.name} is now ${USER_ROLE.labels[result.value.role]}.` };
}
