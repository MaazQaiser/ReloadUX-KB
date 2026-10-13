import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/schemas/user";
import { requireApiRole, requireRole } from "./require-role";
import * as session from "./session";

vi.mock("./session");
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`redirect:${to}`);
  },
}));

const viewer = { id: "64b7f0c2a1b2c3d4e5f60718", role: "viewer" } as User;

beforeEach(() => {
  vi.resetAllMocks();
});

describe("requireRole", () => {
  it("sends signed-out visitors to sign in", async () => {
    vi.mocked(session.getSessionUser).mockResolvedValue(null);
    await expect(requireRole("viewer")).rejects.toThrow("redirect:/login");
  });

  it("sends pending users to wait for approval, whatever the role asked for", async () => {
    vi.mocked(session.getSessionUser).mockResolvedValue({ ...viewer, role: "pending" });
    await expect(requireRole("viewer")).rejects.toThrow("redirect:/pending");
  });

  it("sends users without the role to /forbidden", async () => {
    vi.mocked(session.getSessionUser).mockResolvedValue(viewer);
    await expect(requireRole("editor")).rejects.toThrow("redirect:/forbidden");
  });

  it("returns the user when the role is enough", async () => {
    vi.mocked(session.getSessionUser).mockResolvedValue({ ...viewer, role: "admin" });
    await expect(requireRole("editor")).resolves.toMatchObject({ role: "admin" });
  });
});

describe("requireApiRole", () => {
  it("reports a missing session instead of redirecting", async () => {
    vi.mocked(session.getSessionUser).mockResolvedValue(null);
    await expect(requireApiRole("viewer")).resolves.toEqual({ ok: false, error: "unauthenticated" });
  });

  it("reports a role that is too low", async () => {
    vi.mocked(session.getSessionUser).mockResolvedValue(viewer);
    await expect(requireApiRole("editor")).resolves.toEqual({ ok: false, error: "forbidden" });
  });

  it("returns the user when the role is enough", async () => {
    vi.mocked(session.getSessionUser).mockResolvedValue(viewer);
    await expect(requireApiRole("viewer")).resolves.toEqual({ ok: true, value: viewer });
  });
});
