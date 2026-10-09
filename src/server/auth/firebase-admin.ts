import "server-only";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import type { AuthConfig } from "@/env";

const APP_NAME = "reloadux-kb";

export function getAdminAuth({ admin }: AuthConfig): Auth {
  if (admin.emulatorHost) {
    // The Admin SDK reads this variable itself to talk to the emulator.
    process.env.FIREBASE_AUTH_EMULATOR_HOST = admin.emulatorHost;
  }
  const app = getApps().some((existing) => existing.name === APP_NAME)
    ? getApp(APP_NAME)
    : initializeApp(
        {
          projectId: admin.projectId,
          // Safe: parseAuthConfig requires both unless the emulator is configured.
          ...(!admin.emulatorHost && {
            credential: cert({ projectId: admin.projectId, clientEmail: admin.clientEmail!, privateKey: admin.privateKey! }),
          }),
        },
        APP_NAME,
      );
  return getAuth(app);
}
