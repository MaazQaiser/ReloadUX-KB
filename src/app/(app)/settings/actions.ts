"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TAG_LIST_NAMES, USER_ROLE, type TagListName } from "@/lib/constants";
import { idSchema } from "@/schemas/common";
import { userRoleSchema } from "@/schemas/tags";
import { requireRole } from "@/server/auth";
import { addTagValue } from "@/server/services/tags";
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

const addTagSchema = z.object({
  list: z.enum(TAG_LIST_NAMES as [TagListName, ...TagListName[]]),
  label: z.string().max(100),
});

export async function addTagValueAction(_previous: RoleFormState, formData: FormData): Promise<RoleFormState> {
  const admin = await requireRole("admin");
  const input = addTagSchema.safeParse({ list: formData.get("list"), label: formData.get("label") ?? "" });
  if (!input.success) return { ok: false, message: "Type a value to add." };

  const result = await addTagValue(admin, input.data.list, input.data.label);
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.error === "already_exists"
          ? "That value is already in the list."
          : "Use 2 to 60 characters, starting with a letter.",
    };
  }
  revalidatePath("/settings");
  return { ok: true, message: `Added “${result.value.label}”.` };
}
