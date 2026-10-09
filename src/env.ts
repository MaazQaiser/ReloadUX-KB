import "server-only";
import { z } from "zod";

export const logLevelSchema = z.enum(["debug", "info", "warn", "error"]);
export type LogLevel = z.infer<typeof logLevelSchema>;

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: logLevelSchema.default("info"),
  MONGODB_URI: z
    .string()
    .regex(/^mongodb(\+srv)?:\/\//, "must start with mongodb:// or mongodb+srv://"),
  MONGODB_DB: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,63}$/, "must be 1-63 letters, digits, '_' or '-'"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class EnvError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid environment variables:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    this.name = "EnvError";
  }
}

type EnvSource = Record<string, string | undefined>;

/**
 * Validates environment variables. Problems name the variable but never echo
 * its value, because values are secrets and errors end up in logs.
 */
export function parseServerEnv(source: EnvSource): ServerEnv {
  // Treat empty strings as unset so a blank line in .env.local reads as "missing".
  const cleaned = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== ""),
  );
  const result = serverEnvSchema.safeParse(cleaned);
  if (!result.success) {
    throw new EnvError(
      result.error.issues.map((issue) => {
        const name = issue.path.join(".");
        return issue.code === "invalid_type" ? `${name}: is required` : `${name}: ${issue.message}`;
      }),
    );
  }
  return result.data;
}

let cached: ServerEnv | undefined;

/** Parsed lazily so builds and pages that never touch these values don't need them set. */
export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
