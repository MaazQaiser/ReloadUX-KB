import "server-only";
import { join } from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getServerEnv } from "@/env";

export type Database = PgDatabase<PgQueryResultHKT>;

interface Connection {
  db: Database;
  migrate: () => Promise<void>;
  close: () => Promise<void>;
}

const MIGRATIONS = { migrationsFolder: join(process.cwd(), "drizzle") };

// Dev hot reloads re-evaluate this module; keeping the connection on globalThis
// stops every reload from opening a new pool.
const store = globalThis as typeof globalThis & { reloaduxDb?: Promise<Connection> };

/**
 * postgres:// opens a pool to a real server. pglite:memory or pglite:<dir>
 * runs Postgres in this process (tests, e2e, eval), loaded only when asked
 * for so the app never ships it.
 */
async function connect(url: string): Promise<Connection> {
  if (url.startsWith("pglite:")) {
    const [{ PGlite }, { vector }, { drizzle }, { migrate }] = await Promise.all([
      import("@electric-sql/pglite"),
      import("@electric-sql/pglite-pgvector"),
      import("drizzle-orm/pglite"),
      import("drizzle-orm/pglite/migrator"),
    ]);
    const location = url.slice("pglite:".length);
    const client = new PGlite(location === "memory" ? "memory://" : location, { extensions: { vector } });
    const db = drizzle(client);
    return { db, migrate: () => migrate(db, MIGRATIONS), close: () => client.close() };
  }

  const [{ Pool }, { drizzle }, { migrate }] = await Promise.all([
    import("pg"),
    import("drizzle-orm/node-postgres"),
    import("drizzle-orm/node-postgres/migrator"),
  ]);
  // Serverless functions each hold their own pool; keep them small.
  const pool = new Pool({ connectionString: url, max: 10, connectionTimeoutMillis: 10_000, application_name: "reloadux-kb" });
  const db = drizzle(pool);
  return { db, migrate: () => migrate(db, MIGRATIONS), close: () => pool.end() };
}

function getConnection(): Promise<Connection> {
  if (!store.reloaduxDb) {
    store.reloaduxDb = connect(getServerEnv().DATABASE_URL).catch((error: unknown) => {
      // Let the next call retry instead of caching a failed connection forever.
      store.reloaduxDb = undefined;
      throw error;
    });
  }
  return store.reloaduxDb;
}

export async function getDb(): Promise<Database> {
  return (await getConnection()).db;
}

/** Applies pending migrations from drizzle/ (`pnpm db:migrate`, and throwaway databases in tests). */
export async function migrateDb(): Promise<void> {
  await (await getConnection()).migrate();
}

/** For scripts and tests; app code keeps the connection open for the process lifetime. */
export async function closeDb(): Promise<void> {
  const pending = store.reloaduxDb;
  store.reloaduxDb = undefined;
  if (pending) await (await pending).close();
}
