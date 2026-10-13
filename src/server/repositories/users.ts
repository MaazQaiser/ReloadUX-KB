import "server-only";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { COLLECTIONS } from "@/server/db/collections";
import { actorSchema, type Actor } from "@/schemas/common";
import { userRoleSchema, type UserRole } from "@/schemas/tags";
import { userSchema, type User } from "@/schemas/user";
import { fromDocument, toObjectId } from "./mongo";

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
 * Records a sign-in. New users start as pending (no access until an admin
 * approves them); listed initial admins are promoted. Nobody is ever demoted
 * here: role changes belong to Settings.
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
      $setOnInsert: { created_at: now, ...(!promoteToAdmin && { role: "pending" }) },
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

/** Everyone who has signed in: people waiting for approval first, then by name. */
export async function listUsers(): Promise<User[]> {
  const documents = await (await users()).find({}).collation({ locale: "en", strength: 2 }).sort({ name: 1 }).toArray();
  const all = documents.map((document) => fromDocument(userSchema, COLLECTIONS.users, document));
  return [...all.filter((user) => user.role === "pending"), ...all.filter((user) => user.role !== "pending")];
}

/** Sets a user's role; null if they don't exist. */
export async function updateUserRole(id: string, role: UserRole, actor: Actor): Promise<User | null> {
  const saved = await (await users()).findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: { role: userRoleSchema.parse(role), updated_by: actorSchema.parse(actor), updated_at: new Date() } },
    { returnDocument: "after" },
  );
  return saved ? fromDocument(userSchema, COLLECTIONS.users, saved) : null;
}
