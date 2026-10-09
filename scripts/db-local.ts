import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";
import { logger } from "@/server/logger";

/**
 * A MongoDB for local development until Atlas is connected. It reuses the
 * binary downloaded for integration tests and keeps data in .data/mongo, so
 * seeded projects survive restarts. Point .env.local at it:
 *   MONGODB_URI=mongodb://127.0.0.1:27018
 */
const PORT = 27018;
const dbPath = resolve(".data/mongo");
const log = logger.child({ script: "db-local" });

async function main() {
  mkdirSync(dbPath, { recursive: true });
  const server = await MongoMemoryServer.create({
    instance: { port: PORT, dbPath, storageEngine: "wiredTiger" },
  });
  log.info("local MongoDB running; press Ctrl+C to stop", { port: PORT, dbPath });

  const stop = async () => {
    // Keep the data directory; only stop the process.
    await server.stop({ doCleanup: false });
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((error: unknown) => {
  log.error("local MongoDB failed to start", { error });
  process.exitCode = 1;
});
