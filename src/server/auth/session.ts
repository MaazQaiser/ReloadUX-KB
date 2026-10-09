import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getAuthConfig } from "@/env";
import { isAllowedEmail } from "@/lib/auth-rules";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { err, ok, type Result } from "@/lib/result";
import type { User } from "@/schemas/user";
import { findUserByFirebaseUid, upsertUserOnSignIn } from "@/server/repositories/users";
import { logger } from "@/server/logger";
import { getAdminAuth } from "./firebase-admin";

/** Firebase allows 5 minutes to 14 days; five days keeps people signed in for a working week. */
export const SESSION_MAX_AGE_SECONDS = 5 * 24 * 60 * 60;
// Firebase recommends minting session cookies only right after a fresh sign-in.
const MAX_SIGN_IN_AGE_SECONDS = 5 * 60;

export type CreateSessionError = "not_configured" | "invalid_token" | "stale_sign_in" | "email_not_allowed";

const log = logger.child({ module: "auth" });

/** Turns a fresh Google sign-in into a session cookie, if the account is allowed in. */
export async function createSession(
  idToken: string,
  now: () => number = Date.now,
): Promise<Result<{ cookie: string; user: User }, CreateSessionError>> {
  const config = getAuthConfig();
  if (!config) return err("not_configured");
  const auth = getAdminAuth(config);

  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken, true);
  } catch (error) {
    log.warn("sign-in token rejected", { error });
    return err("invalid_token");
  }

  if (now() / 1000 - decoded.auth_time > MAX_SIGN_IN_AGE_SECONDS) return err("stale_sign_in");
  if (!decoded.email || decoded.email_verified !== true || !isAllowedEmail(decoded.email)) {
    log.warn("sign-in refused: email not allowed", { firebaseUid: decoded.uid });
    return err("email_not_allowed");
  }

  const email = decoded.email.toLowerCase();
  const user = await upsertUserOnSignIn(
    { firebase_uid: decoded.uid, email, name: typeof decoded.name === "string" && decoded.name ? decoded.name : email },
    { promoteToAdmin: config.initialAdminEmails.includes(email) },
  );
  const cookie = await auth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_SECONDS * 1000 });
  log.info("signed in", { userId: user.id, role: user.role });
  return ok({ cookie, user });
}

/**
 * The signed-in user for this request, or null. Checks the cookie with
 * Firebase (including revocation) and re-checks the domain every time.
 * Cached per request, so several components can ask without extra calls.
 */
export const getSessionUser = cache(async (): Promise<User | null> => {
  const config = getAuthConfig();
  if (!config) return null;
  const cookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;

  try {
    const decoded = await getAdminAuth(config).verifySessionCookie(cookie, true);
    const user = await findUserByFirebaseUid(decoded.uid);
    return user && isAllowedEmail(user.email) ? user : null;
  } catch (error) {
    log.info("session cookie rejected", { error });
    return null;
  }
});

/** Revokes every session for the cookie's user, so signing out on one device ends them all. */
export async function endSession(cookie: string | undefined): Promise<void> {
  const config = getAuthConfig();
  if (!config || !cookie) return;
  try {
    const auth = getAdminAuth(config);
    const decoded = await auth.verifySessionCookie(cookie);
    await auth.revokeRefreshTokens(decoded.sub);
  } catch (error) {
    log.info("sign-out with an invalid session cookie", { error });
  }
}
