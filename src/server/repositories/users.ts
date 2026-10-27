import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { actorSchema, type Actor } from "@/schemas/common";
import { userRoleSchema, type UserRole } from "@/schemas/tags";
import { userSchema, type User } from "@/schemas/user";
import { fromRow, newId } from "./rows";

const SIGN_IN_ACTOR = "system:auth";

const signInSchema = z.object({
  firebase_uid: z.string().min(1).max(128),
  email: z.email().toLowerCase(),
  name: z.string().trim().min(1).max(200),
  // Google's photo URL; dropped if it isn't a plain https link rather than failing the sign-in.
  photo_url: z.url({ protocol: /^https$/ }).optional().catch(undefined),
});

function toUser(row: typeof users.$inferSelect): User {
  return fromRow(userSchema, "users", row);
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
  const { photo_url, ...identity } = signInSchema.parse(input);
  const now = new Date();
  const values = { ...identity, photo_url: photo_url ?? null, last_sign_in_at: now, updated_by: SIGN_IN_ACTOR, updated_at: now };

  // Match on the verified email: the Firebase uid changes if the Firebase project does,
  // and the person (and their role) should carry over.
  const [saved] = await (await getDb())
    .insert(users)
    .values({ id: newId(), ...values, created_at: now, role: promoteToAdmin ? "admin" : "pending" })
    .onConflictDoUpdate({ target: users.email, set: { ...values, ...(promoteToAdmin && { role: "admin" }) } })
    .returning();
  // Safe: an upsert always returns its row.
  return toUser(saved!);
}

export async function findUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
  const [row] = await (await getDb()).select().from(users).where(eq(users.firebase_uid, firebaseUid)).limit(1);
  return row ? toUser(row) : null;
}

/** Everyone who has signed in: people waiting for approval first, then by name. */
export async function listUsers(): Promise<User[]> {
  const rows = await (await getDb()).select().from(users).orderBy(asc(sql`${users.role} <> 'pending'`), asc(sql`lower(${users.name})`));
  return rows.map(toUser);
}

/** Sets a user's role; null if they don't exist. */
export async function updateUserRole(id: string, role: UserRole, actor: Actor): Promise<User | null> {
  const [saved] = await (await getDb())
    .update(users)
    .set({ role: userRoleSchema.parse(role), updated_by: actorSchema.parse(actor), updated_at: new Date() })
    .where(eq(users.id, id))
    .returning();
  return saved ? toUser(saved) : null;
}

/** Updates what a person can change about themselves; null if they no longer exist. */
export async function updateOwnProfile(id: string, { designation }: { designation?: string }): Promise<User | null> {
  const [saved] = await (await getDb())
    .update(users)
    .set({ designation: designation ?? null, updated_by: id, updated_at: new Date() })
    .where(eq(users.id, id))
    .returning();
  return saved ? toUser(saved) : null;
}
