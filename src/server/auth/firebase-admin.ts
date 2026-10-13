import "server-only";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import type { AuthConfig } from "@/env";

export function getAdminAuth({ admin }: AuthConfig): Auth {
  // The Admin SDK reads this variable itself. Clear it when not emulating, so a dev
  // server that once ran against the emulator doesn't keep sending real sign-ins there.
  if (admin.emulatorHost) process.env.FIREBASE_AUTH_EMULATOR_HOST = admin.emulatorHost;
  else delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

  // One app per project and mode: a config change (emulator → real project) gets a fresh
  // app instead of reusing one initialised for the old project across hot reloads.
  const name = `reloadux-kb:${admin.projectId}:${admin.emulatorHost ? "emulator" : "live"}`;
  const app = getApps().some((existing) => existing.name === name)
    ? getApp(name)
    : initializeApp(
        {
          projectId: admin.projectId,
          // Safe: parseAuthConfig requires both unless the emulator is configured.
          ...(!admin.emulatorHost && {
            credential: cert({ projectId: admin.projectId, clientEmail: admin.clientEmail!, privateKey: admin.privateKey! }),
          }),
        },
        name,
      );
  return getAuth(app);
}
