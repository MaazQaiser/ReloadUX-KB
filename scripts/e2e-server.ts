import { spawn, type ChildProcess } from "node:child_process";
import { createConnection } from "node:net";
import { MongoMemoryServer } from "mongodb-memory-server";
import { closeMongoClient } from "@/server/db/client";
import { logger } from "@/server/logger";
import { updateUserRole, upsertUserOnSignIn } from "@/server/repositories/users";
import { EMULATOR_PROJECT_ID, startAuthEmulator } from "./auth-emulator";
import { seedDatabase } from "./seed/run";

/**
 * What Playwright runs against: a throwaway seeded MongoDB, its own Firebase
 * Auth Emulator, and a dev server on port 3100 with its own build folder, so
 * it never collides with a dev server or emulator you already have running.
 * A dev server, not a production build, because the emulator is refused in
 * production (it skips token signature checks).
 */
const PORT = "3100";
const EMULATOR_HOST = "127.0.0.1:9199";
export const E2E_ADMIN_EMAIL = "admin@reloadux.com";
// New accounts wait for an admin's approval; these stand in for teammates already let in.
const E2E_VIEWER_EMAILS = ["viewer@reloadux.com", "returning@reloadux.com", "leaving@reloadux.com"];
const log = logger.child({ script: "e2e-server" });

function waitForPort(host: string, port: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = createConnection({ host, port }, () => {
        socket.end();
        resolve();
      });
      socket.on("error", () => {
        socket.destroy();
        if (Date.now() > deadline) reject(new Error(`${host}:${port} did not open in time`));
        else setTimeout(attempt, 250);
      });
    };
    attempt();
  });
}

/** Sign-in matches by email, so the emulator account takes over this record and its role. */
async function approveViewers() {
  for (const email of E2E_VIEWER_EMAILS) {
    const user = await upsertUserOnSignIn(
      { firebase_uid: `e2e-${email}`, email, name: email.split("@")[0] ?? email },
      { promoteToAdmin: false },
    );
    await updateUserRole(user.id, "viewer", "system:e2e");
  }
}

async function main() {
  const children: ChildProcess[] = [];
  const mongo = await MongoMemoryServer.create();
  const shutdown = async (code: number) => {
    for (const child of children) child.kill("SIGTERM");
    await mongo.stop();
    process.exit(code);
  };
  process.on("SIGINT", () => void shutdown(0));
  process.on("SIGTERM", () => void shutdown(0));

  process.env.MONGODB_URI = mongo.getUri();
  process.env.MONGODB_DB = "e2e";
  await seedDatabase({ dryRun: false, log });
  await approveViewers();
  await closeMongoClient();

  const emulator = startAuthEmulator("firebase.e2e.json");
  children.push(emulator);
  emulator.on("exit", (code) => void shutdown(code ?? 1));
  await waitForPort("127.0.0.1", 9199, 60_000);

  // Variables set here win over anything in .env.local.
  const env = {
    ...process.env,
    NEXT_DIST_DIR: ".next-e2e",
    NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: `${EMULATOR_PROJECT_ID}.firebaseapp.com`,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: EMULATOR_PROJECT_ID,
    FIREBASE_AUTH_EMULATOR_HOST: EMULATOR_HOST,
    FIREBASE_CLIENT_EMAIL: "",
    FIREBASE_PRIVATE_KEY: "",
    INITIAL_ADMIN_EMAILS: E2E_ADMIN_EMAIL,
  };
  const next = spawn("pnpm", ["exec", "next", "dev", "--port", PORT], { stdio: "inherit", env });
  children.push(next);
  next.on("exit", (code) => void shutdown(code ?? 1));
}

main().catch((error: unknown) => {
  log.error("e2e server failed to start", { error });
  process.exit(1);
});
