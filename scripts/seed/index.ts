import { parseArgs } from "node:util";
import { closeMongoClient } from "@/server/db/client";
import { logger } from "@/server/logger";
import { seedDatabase } from "./run";

const log = logger.child({ script: "seed" });

async function main(): Promise<number> {
  const { values } = parseArgs({ options: { "dry-run": { type: "boolean", default: false } }, strict: true });
  await seedDatabase({ dryRun: values["dry-run"], log });
  return 0;
}

main()
  .catch((error: unknown) => {
    log.error("seed failed", { error, details: error instanceof Error && "details" in error ? error.details : undefined });
    return 1;
  })
  .then(async (code) => {
    await closeMongoClient();
    process.exitCode = code;
  });
