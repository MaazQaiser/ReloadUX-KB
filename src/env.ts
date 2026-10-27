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
function parseEnv<T extends z.ZodType>(schema: T, source: EnvSource): z.infer<T> {
  // Treat empty strings as unset so a blank line in .env.local reads as "missing".
  const cleaned = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== ""),
  );
  const result = schema.safeParse(cleaned);
  if (!result.success) {
    throw new EnvError(
      result.error.issues.map((issue) => {
        const name = issue.path.join(".") || "environment";
        return issue.code === "invalid_type" ? `${name}: is required` : `${name}: ${issue.message}`;
      }),
    );
  }
  return result.data;
}

export function parseServerEnv(source: EnvSource): ServerEnv {
  return parseEnv(serverEnvSchema, source);
}

let cached: ServerEnv | undefined;

/** Parsed lazily so builds and pages that never touch these values don't need them set. */
export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}

const authEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    // Firebase web config: public by design, passed to the sign-in button as props.
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().regex(/^[a-z0-9-]{4,40}$/, "must be a Firebase project id"),
    // Admin service account: server only. Not needed against the emulator.
    FIREBASE_CLIENT_EMAIL: z.email().optional(),
    // Stored on one line in .env files, with \n for line breaks.
    FIREBASE_PRIVATE_KEY: z
      .string()
      .optional()
      .transform((key) => key?.replace(/\\n/g, "\n")),
    FIREBASE_AUTH_EMULATOR_HOST: z
      .string()
      .regex(/^[\w.-]+:\d+$/, "must be host:port")
      .optional(),
    INITIAL_ADMIN_EMAILS: z
      .string()
      .optional()
      .transform((list) =>
        (list ?? "")
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      ),
  })
  .refine((env) => env.FIREBASE_AUTH_EMULATOR_HOST || (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY), {
    message: "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are required unless FIREBASE_AUTH_EMULATOR_HOST is set",
  })
  .refine((env) => !(env.NODE_ENV === "production" && env.FIREBASE_AUTH_EMULATOR_HOST), {
    message: "FIREBASE_AUTH_EMULATOR_HOST must not be set in production",
  });

export interface AuthConfig {
  web: { apiKey: string; authDomain: string; projectId: string; emulatorHost?: string };
  admin: { projectId: string; clientEmail?: string; privateKey?: string; emulatorHost?: string };
  initialAdminEmails: string[];
}

const AUTH_VARIABLES = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_AUTH_EMULATOR_HOST",
];

/**
 * Returns null when sign-in isn't configured at all, so the app can say so
 * and stay locked. A partial configuration is a mistake, so it throws.
 */
export function parseAuthConfig(source: EnvSource): AuthConfig | null {
  if (!AUTH_VARIABLES.some((name) => source[name])) return null;
  const env = parseEnv(authEnvSchema, source);
  return {
    web: {
      apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      emulatorHost: env.FIREBASE_AUTH_EMULATOR_HOST,
    },
    admin: {
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
      emulatorHost: env.FIREBASE_AUTH_EMULATOR_HOST,
    },
    initialAdminEmails: env.INITIAL_ADMIN_EMAILS,
  };
}

let cachedAuth: AuthConfig | null | undefined;

export function getAuthConfig(): AuthConfig | null {
  if (cachedAuth === undefined) cachedAuth = parseAuthConfig(process.env);
  return cachedAuth;
}

export interface Integrations {
  anthropic: boolean;
  voyage: boolean;
  r2: boolean;
}

const R2_VARIABLES = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"] as const;

/**
 * Which outside services have credentials, so screens can say "not connected"
 * instead of failing. Presence only: each client validates its own settings
 * when it's wired up.
 */
export function parseIntegrations(source: EnvSource): Integrations {
  const set = (name: string) => Boolean(source[name]?.trim());
  return {
    anthropic: set("ANTHROPIC_API_KEY"),
    voyage: set("VOYAGE_API_KEY"),
    r2: R2_VARIABLES.every(set),
  };
}

export function getIntegrations(): Integrations {
  return parseIntegrations(process.env);
}

const aiEnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(20, "looks too short to be an API key").optional(),
  VOYAGE_API_KEY: z.string().min(20, "looks too short to be an API key").optional(),
});

export interface AiConfig {
  /** Unset means the Ask screen keeps its preview answers (development without keys, e2e). */
  anthropicApiKey?: string;
  /** Needed for embeddings and reranking; search falls back to keywords without it. */
  voyageApiKey?: string;
}

export function parseAiConfig(source: EnvSource): AiConfig {
  const env = parseEnv(aiEnvSchema, source);
  return { anthropicApiKey: env.ANTHROPIC_API_KEY, voyageApiKey: env.VOYAGE_API_KEY };
}

let cachedAi: AiConfig | undefined;

export function getAiConfig(): AiConfig {
  cachedAi ??= parseAiConfig(process.env);
  return cachedAi;
}
