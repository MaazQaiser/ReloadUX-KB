import { beforeEach, describe, expect, it, vi } from "vitest";
import * as env from "@/env";
import type { User } from "@/schemas/user";
import * as usersRepository from "@/server/repositories/users";
import * as firebaseAdmin from "./firebase-admin";
import { createSession, endSession, getSessionUser } from "./session";

vi.mock("@/env", async (importOriginal) => ({ ...(await importOriginal<typeof env>()), getAuthConfig: vi.fn() }));
vi.mock("@/server/repositories/users");
vi.mock("./firebase-admin");
const cookieStore = { get: vi.fn() };
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));
vi.mock("next/server", () => ({ connection: async () => undefined }));

const CONFIG: env.AuthConfig = {
  web: { apiKey: "k", authDomain: "d", projectId: "reloadux-kb" },
  admin: { projectId: "reloadux-kb", clientEmail: "a@b.c", privateKey: "key" },
  initialAdminEmails: ["boss@reloadux.com"],
};
const NOW = 1_800_000_000_000;

const adminAuth = {
  verifyIdToken: vi.fn(),
  createSessionCookie: vi.fn(),
  verifySessionCookie: vi.fn(),
  revokeRefreshTokens: vi.fn(),
};

const user: User = {
  id: "64b7f0c2a1b2c3d4e5f60718",
  firebase_uid: "uid-sara",
  email: "sara@reloadux.com",
  name: "Sara",
  role: "viewer",
  created_at: new Date(NOW),
  last_sign_in_at: new Date(NOW),
  updated_by: "system:auth",
  updated_at: new Date(NOW),
};

function token(overrides: Record<string, unknown> = {}) {
  return { uid: "uid-sara", sub: "uid-sara", email: "Sara@reloadux.com", email_verified: true, name: "Sara", auth_time: NOW / 1000 - 10, ...overrides };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(env.getAuthConfig).mockReturnValue(CONFIG);
  vi.mocked(firebaseAdmin.getAdminAuth).mockReturnValue(adminAuth as never);
  vi.mocked(usersRepository.upsertUserOnSignIn).mockResolvedValue(user);
  adminAuth.createSessionCookie.mockResolvedValue("session-cookie");
});

describe("createSession", () => {
  it("refuses when sign-in isn't configured", async () => {
    vi.mocked(env.getAuthConfig).mockReturnValue(null);
    expect(await createSession("t", () => NOW)).toEqual({ ok: false, error: "not_configured" });
  });

  it("refuses a token Firebase rejects", async () => {
    adminAuth.verifyIdToken.mockRejectedValue(new Error("expired"));
    expect(await createSession("t", () => NOW)).toEqual({ ok: false, error: "invalid_token" });
    expect(adminAuth.verifyIdToken).toHaveBeenCalledWith("t", true);
  });

  it("refuses a sign-in older than five minutes", async () => {
    adminAuth.verifyIdToken.mockResolvedValue(token({ auth_time: NOW / 1000 - 301 }));
    expect(await createSession("t", () => NOW)).toEqual({ ok: false, error: "stale_sign_in" });
  });

  it.each([
    ["another domain", { email: "sara@gmail.com" }],
    ["an unverified email", { email_verified: false }],
    ["no email", { email: undefined }],
  ])("refuses %s without creating a user or cookie", async (_case, overrides) => {
    adminAuth.verifyIdToken.mockResolvedValue(token(overrides));

    expect(await createSession("t", () => NOW)).toEqual({ ok: false, error: "email_not_allowed" });
    expect(usersRepository.upsertUserOnSignIn).not.toHaveBeenCalled();
    expect(adminAuth.createSessionCookie).not.toHaveBeenCalled();
  });

  it("records the user and returns a five-day session cookie", async () => {
    adminAuth.verifyIdToken.mockResolvedValue(token());

    expect(await createSession("t", () => NOW)).toEqual({ ok: true, value: { cookie: "session-cookie", user } });
    expect(usersRepository.upsertUserOnSignIn).toHaveBeenCalledWith(
      { firebase_uid: "uid-sara", email: "sara@reloadux.com", name: "Sara" },
      { promoteToAdmin: false },
    );
    expect(adminAuth.createSessionCookie).toHaveBeenCalledWith("t", { expiresIn: 5 * 24 * 60 * 60 * 1000 });
  });

  it("promotes initial admins and falls back to the email for a missing name", async () => {
    adminAuth.verifyIdToken.mockResolvedValue(token({ email: "Boss@reloadux.com", name: undefined }));
    await createSession("t", () => NOW);

    expect(usersRepository.upsertUserOnSignIn).toHaveBeenCalledWith(
      expect.objectContaining({ email: "boss@reloadux.com", name: "boss@reloadux.com" }),
      { promoteToAdmin: true },
    );
  });
});

describe("getSessionUser", () => {
  it("returns null with no config, no cookie or a rejected cookie", async () => {
    vi.mocked(env.getAuthConfig).mockReturnValue(null);
    expect(await getSessionUser()).toBeNull();

    vi.mocked(env.getAuthConfig).mockReturnValue(CONFIG);
    cookieStore.get.mockReturnValue(undefined);
    expect(await getSessionUser()).toBeNull();

    cookieStore.get.mockReturnValue({ value: "bad" });
    adminAuth.verifySessionCookie.mockRejectedValue(new Error("revoked"));
    expect(await getSessionUser()).toBeNull();
  });

  it("returns the stored user for a valid cookie, checking revocation", async () => {
    cookieStore.get.mockReturnValue({ value: "good" });
    adminAuth.verifySessionCookie.mockResolvedValue(token());
    vi.mocked(usersRepository.findUserByFirebaseUid).mockResolvedValue(user);

    expect(await getSessionUser()).toEqual(user);
    expect(adminAuth.verifySessionCookie).toHaveBeenCalledWith("good", true);
  });

  it("refuses a stored user whose email is no longer allowed", async () => {
    cookieStore.get.mockReturnValue({ value: "good" });
    adminAuth.verifySessionCookie.mockResolvedValue(token());
    vi.mocked(usersRepository.findUserByFirebaseUid).mockResolvedValue({ ...user, email: "sara@gmail.com" });

    expect(await getSessionUser()).toBeNull();
  });
});

describe("endSession", () => {
  it("revokes the user's sessions", async () => {
    adminAuth.verifySessionCookie.mockResolvedValue(token());
    await endSession("good");
    expect(adminAuth.revokeRefreshTokens).toHaveBeenCalledWith("uid-sara");
  });

  it("does nothing for a missing or invalid cookie", async () => {
    await endSession(undefined);
    adminAuth.verifySessionCookie.mockRejectedValue(new Error("bad"));
    await expect(endSession("bad")).resolves.toBeUndefined();
    expect(adminAuth.revokeRefreshTokens).not.toHaveBeenCalled();
  });
});
