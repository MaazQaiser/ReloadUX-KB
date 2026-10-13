"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/auth";
import { setOwnDesignation } from "@/server/services/users";

export type ProfileState = { ok: boolean; message: string } | null;

export async function saveDesignationAction(_previous: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireRole("viewer");
  const result = await setOwnDesignation(user, String(formData.get("designation") ?? ""));
  if (!result.ok) return { ok: false, message: "Keep it under 80 characters." };
  // The header shows the designation on every page.
  revalidatePath("/", "layout");
  return { ok: true, message: result.value.designation ? "Saved." : "Cleared." };
}
