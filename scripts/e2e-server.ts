import { spawn } from "node:child_process";
import { MongoMemoryServer } from "mongodb-memory-server";
import { closeMongoClient } from "@/server/db/client";
import { logger } from "@/server/logger";
import { seedDatabase } from "./seed/run";

/**
 * The server Playwright tests run against: a throwaway MongoDB with the seed
 * data, and the production build on port 3100. Nothing touches .env.local
 * data, so e2e runs are repeatable.
 */
const PORT = "3100";
const log = logger.child({ script: "e2e-server" });

async function main() {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.MONGODB_DB = "e2e";

  await seedDatabase({ dryRun: false, log });
  await closeMongoClient();

  const next = spawn("pnpm", ["exec", "next", "start", "--port", PORT], { stdio: "inherit", env: process.env });

  const shutdown = async () => {
    next.kill("SIGTERM");
    await mongo.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  next.on("exit", async (code) => {
    await mongo.stop();
    process.exit(code ?? 1);
  });
}

main().catch((error: unknown) => {
  log.error("e2e server failed to start", { error });
  process.exit(1);
});
