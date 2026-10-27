import "server-only";
import { logLevelSchema, type LogLevel } from "@/env";

export type LogContext = Record<string, unknown>;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  /** Returns a logger that adds `context` to every line, e.g. a request or job id. */
  child(context: LogContext): Logger;
}

type Write = (line: string, level: LogLevel) => void;

interface LoggerOptions {
  level: LogLevel;
  write?: Write;
  base?: LogContext;
  now?: () => Date;
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

// Matched against context keys, so secrets and personal data never reach log storage.
const SENSITIVE_KEY = /pass(word)?|secret|token|api[-_]?key|authorization|cookie|private[-_]?key|credential|uri|database[-_]?url|email/i;
const MAX_DEPTH = 6;

function sanitize(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (value === null || typeof value !== "object") {
    return typeof value === "bigint" ? value.toString() : value;
  }
  if (value instanceof Date) return value.toISOString();
  if (seen.has(value)) return "[circular]";
  if (depth >= MAX_DEPTH) return "[truncated]";
  seen.add(value);

  if (Array.isArray(value)) return value.map((item) => sanitize(item, depth + 1, seen));

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? "[redacted]" : sanitize(item, depth + 1, seen),
    ]),
  );
}

const writeToProcess: Write = (line, level) => {
  const stream = level === "warn" || level === "error" ? process.stderr : process.stdout;
  stream.write(`${line}\n`);
};

export function createLogger({ level, write = writeToProcess, base = {}, now = () => new Date() }: LoggerOptions): Logger {
  const log = (lineLevel: LogLevel, message: string, context: LogContext = {}) => {
    if (LEVEL_ORDER[lineLevel] < LEVEL_ORDER[level]) return;
    const fields = sanitize({ ...base, ...context }, 0, new WeakSet());
    write(JSON.stringify({ time: now().toISOString(), level: lineLevel, message, ...(fields as LogContext) }), lineLevel);
  };

  return {
    debug: (message, context) => log("debug", message, context),
    info: (message, context) => log("info", message, context),
    warn: (message, context) => log("warn", message, context),
    error: (message, context) => log("error", message, context),
    child: (context) => createLogger({ level, write, now, base: { ...base, ...context } }),
  };
}

// Reads LOG_LEVEL directly rather than through getServerEnv(), so the logger
// still works when other variables are invalid and that error needs logging.
export const logger = createLogger({
  level: logLevelSchema.catch("info").parse(process.env.LOG_LEVEL),
});
