import "server-only";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { COLLECTIONS } from "@/server/db/collections";
import { userSchema, type User } from "@/schemas/user";
import { fromDocument } from "./mongo";

const SIGN_IN_ACTOR = "system:auth";

const signInSchema = z.object({
  firebase_uid: z.string().min(1).max(128),
  email: z.email().toLowerCase(),
  name: z.string().trim().min(1).max(200),
});

async function users() {
  return (await getDb()).collection(COLLECTIONS.users);
}

/**
 * Records a sign-in. New users start as viewers; listed initial admins are
 * promoted. Nobody is ever demoted here: role changes belong to Settings.
 */
export async function upsertUserOnSignIn(
  input: z.input<typeof signInSchema>,
  { promoteToAdmin }: { promoteToAdmin: boolean },
): Promise<User> {
  const identity = signInSchema.parse(input);
  const now = new Date();

  const saved = await (await users()).findOneAndUpdate(
    { firebase_uid: identity.firebase_uid },
    {
      $set: {
        ...identity,
        last_sign_in_at: now,
        updated_by: SIGN_IN_ACTOR,
        updated_at: now,
        ...(promoteToAdmin && { role: "admin" }),
      },
      $setOnInsert: { created_at: now, ...(!promoteToAdmin && { role: "viewer" }) },
    },
    { upsert: true, returnDocument: "after" },
  );
  // Safe: with upsert and returnDocument "after", Mongo always returns the document.
  return fromDocument(userSchema, COLLECTIONS.users, saved!);
}

export async function findUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
  const document = await (await users()).findOne({ firebase_uid: firebaseUid });
  return document ? fromDocument(userSchema, COLLECTIONS.users, document) : null;
}
