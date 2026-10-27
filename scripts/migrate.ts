import { closeDb, migrateDb } from "@/server/db/client";
import { logger } from "@/server/logger";

/**
 * Applies the migrations in drizzle/ that the database hasn't seen yet. Safe
 * to run twice. To change the schema, edit src/server/db/schema.ts, run
 * `pnpm db:generate`, review the SQL it writes, then run this.
 */
const log = logger.child({ script: "migrate" });

migrateDb()
  .then(() => {
    log.info("database is up to date");
    return 0;
  })
  .catch((error: unknown) => {
    log.error("migration failed", { error });
    return 1;
  })
  .then(async (code) => {
    await closeDb();
    process.exitCode = code;
  });
