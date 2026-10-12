import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { delimiter, join } from "node:path";

/**
 * Runs the Firebase Auth Emulator: a local stand-in for Google sign-in used in
 * development and e2e tests. It needs Java, which Homebrew installs without
 * putting on PATH, so look for it there before giving up.
 */
export const EMULATOR_PROJECT_ID = "demo-reloadux-kb";
export const EMULATOR_HOST = "127.0.0.1:9099";

const JAVA_LOCATIONS = [
  process.env.JAVA_HOME && join(process.env.JAVA_HOME, "bin"),
  "/opt/homebrew/opt/openjdk/bin",
  "/usr/local/opt/openjdk/bin",
].filter((dir): dir is string => Boolean(dir));

function javaWorks(env: NodeJS.ProcessEnv): boolean {
  return spawnSync("java", ["-version"], { env, stdio: "ignore" }).status === 0;
}

export function envWithJava(): NodeJS.ProcessEnv {
  if (javaWorks(process.env)) return process.env;
  for (const dir of JAVA_LOCATIONS) {
    if (!existsSync(join(dir, "java"))) continue;
    const env = { ...process.env, PATH: `${dir}${delimiter}${process.env.PATH ?? ""}` };
    if (javaWorks(env)) return env;
  }
  throw new Error("Java not found. Install it with `brew install openjdk`, or set JAVA_HOME.");
}

/** `config` picks the ports: firebase.json for development, firebase.e2e.json for tests. */
export function startAuthEmulator(config = "firebase.json") {
  // A "demo-" project id needs no real Firebase project or login.
  return spawn(
    "pnpm",
    ["exec", "firebase", "emulators:start", "--only", "auth", "--project", EMULATOR_PROJECT_ID, "--config", config],
    { env: envWithJava(), stdio: "inherit" },
  );
}

if (process.argv[1]?.endsWith("auth-emulator.ts")) {
  const emulator = startAuthEmulator();
  emulator.on("exit", (code) => process.exit(code ?? 1));
  for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => emulator.kill(signal));
}
