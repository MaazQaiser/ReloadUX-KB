import { defineConfig } from "drizzle-kit";

// drizzle-kit reads the schema and writes SQL migrations into drizzle/; `pnpm db:migrate` applies them.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
