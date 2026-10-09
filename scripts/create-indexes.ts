import { parseArgs } from "node:util";
import { closeMongoClient, getDb } from "@/server/db/client";
import { syncIndexes } from "@/server/db/indexes";
import { logger } from "@/server/logger";

async function main(): Promise<number> {
  const { values } = parseArgs({ options: { "dry-run": { type: "boolean", default: false } }, strict: true });
  const dryRun = values["dry-run"];
  const log = logger.child({ script: "create-indexes", dryRun });

  const results = await syncIndexes(await getDb(), { dryRun });
  for (const result of results) log.info("index", { ...result });

  const conflicts = results.filter((result) => result.action === "conflict");
  if (conflicts.length > 0) {
    log.error("indexes exist with a different definition; drop them manually after review", {
      conflicts: conflicts.map((c) => `${c.collection}.${c.name}`),
    });
    return 1;
  }
  log.info(dryRun ? "dry run complete, nothing written" : "indexes in sync");
  return 0;
}

main()
  .catch((error: unknown) => {
    logger.error("create-indexes failed", { error });
    return 1;
  })
  .then(async (code) => {
    await closeMongoClient();
    process.exitCode = code;
  });
