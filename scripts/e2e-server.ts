import { spawn, type ChildProcess } from "node:child_process";
import { rmSync } from "node:fs";
import { createConnection } from "node:net";
import { resolve } from "node:path";
import { closeDb } from "@/server/db/client";
import { logger } from "@/server/logger";
import { EMULATOR_PROJECT_ID, startAuthEmulator } from "./auth-emulator";
import { seedDatabase } from "./seed/run";

/**
 * What Playwright runs against: a throwaway seeded PGlite database, its own Firebase
 * Auth Emulator, and a dev server on port 3100 with its own build folder, so
 * it never collides with a dev server or emulator you already have running.
 * A dev server, not a production build, because the emulator is refused in
 * production (it skips token signature checks).
 */
const PORT = "3100";
// PGlite in a folder: seeded here, then opened by the dev server (one process at a time).
const DATA_DIR = resolve(".data/e2e-pglite");
const EMULATOR_HOST = "127.0.0.1:9199";
export const E2E_ADMIN_EMAIL = "admin@reloadux.com";
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

async function main() {
  const children: ChildProcess[] = [];
  const shutdown = async (code: number) => {
    for (const child of children) child.kill("SIGTERM");
    process.exit(code);
  };
  process.on("SIGINT", () => void shutdown(0));
  process.on("SIGTERM", () => void shutdown(0));

  rmSync(DATA_DIR, { recursive: true, force: true });
  process.env.DATABASE_URL = `pglite:${DATA_DIR}`;
  await seedDatabase({ dryRun: false, log });
  await closeDb();

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
