import { describe, expect, it } from "vitest";
import { EnvError, parseAuthConfig, parseIntegrations, parseServerEnv } from "./env";

const valid = {
  MONGODB_URI: "mongodb+srv://user:s3cret@cluster0.example.mongodb.net",
  MONGODB_DB: "reloadux_dev",
};

function problemsFor(source: Record<string, string | undefined>): string[] {
  try {
    parseServerEnv(source);
  } catch (error) {
    if (error instanceof EnvError) return error.problems;
    throw error;
  }
  throw new Error("expected parseServerEnv to throw");
}

describe("parseServerEnv", () => {
  it("parses valid values and applies defaults", () => {
    expect(parseServerEnv(valid)).toEqual({
      ...valid,
      NODE_ENV: "development",
      LOG_LEVEL: "info",
    });
  });

  it("reports every missing required variable", () => {
    expect(problemsFor({})).toEqual(["MONGODB_URI: is required", "MONGODB_DB: is required"]);
  });

  it("treats empty strings as missing", () => {
    expect(problemsFor({ ...valid, MONGODB_DB: "" })).toEqual(["MONGODB_DB: is required"]);
  });

  it("rejects a malformed connection string without echoing it", () => {
    const secret = "postgres://admin:hunter2@db.example.com";
    const error = (() => {
      try {
        parseServerEnv({ ...valid, MONGODB_URI: secret });
      } catch (caught) {
        return caught;
      }
    })();

    expect(error).toBeInstanceOf(EnvError);
    expect(String(error)).toContain("MONGODB_URI: must start with mongodb://");
    expect(String(error)).not.toContain("hunter2");
  });

  it("rejects an unknown log level", () => {
    expect(problemsFor({ ...valid, LOG_LEVEL: "verbose" })).toHaveLength(1);
  });

  it("ignores unrelated variables", () => {
    expect(parseServerEnv({ ...valid, PATH: "/usr/bin" })).not.toHaveProperty("PATH");
  });
});

describe("parseAuthConfig", () => {
  const web = {
    NEXT_PUBLIC_FIREBASE_API_KEY: "web-key",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "reloadux-kb.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "reloadux-kb",
  };
  const admin = {
    FIREBASE_CLIENT_EMAIL: "firebase-adminsdk@reloadux-kb.iam.gserviceaccount.com",
    FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n",
  };

  it("returns null when nothing is configured, so the app stays locked", () => {
    expect(parseAuthConfig({ MONGODB_URI: "mongodb://x" })).toBeNull();
  });

  it("parses a full configuration and restores line breaks in the key", () => {
    const config = parseAuthConfig({ ...web, ...admin, INITIAL_ADMIN_EMAILS: " Sara@reloadux.com, ali@reloadux.com " });

    expect(config?.web).toEqual({ apiKey: "web-key", authDomain: "reloadux-kb.firebaseapp.com", projectId: "reloadux-kb" });
    expect(config?.admin.privateKey).toBe("-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n");
    expect(config?.initialAdminEmails).toEqual(["sara@reloadux.com", "ali@reloadux.com"]);
  });

  it("throws on a partial configuration without echoing secrets", () => {
    expect(() => parseAuthConfig({ ...web })).toThrow(/FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are required/);
    expect(() => parseAuthConfig({ FIREBASE_PRIVATE_KEY: "super-secret" })).toThrow(EnvError);
    try {
      parseAuthConfig({ FIREBASE_PRIVATE_KEY: "super-secret" });
    } catch (error) {
      expect(String(error)).not.toContain("super-secret");
    }
  });

  it("accepts the emulator without admin credentials", () => {
    const config = parseAuthConfig({ ...web, FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" });
    expect(config?.admin).toEqual({ projectId: "reloadux-kb", emulatorHost: "127.0.0.1:9099" });
    expect(config?.web.emulatorHost).toBe("127.0.0.1:9099");
  });

  it("refuses the emulator in production", () => {
    expect(() =>
      parseAuthConfig({ ...web, FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099", NODE_ENV: "production" }),
    ).toThrow(/must not be set in production/);
  });
});

describe("parseIntegrations", () => {
  it("reports each service as connected only when all its keys are set", () => {
    expect(parseIntegrations({})).toEqual({ anthropic: false, voyage: false, r2: false });
    expect(
      parseIntegrations({
        ANTHROPIC_API_KEY: "a",
        VOYAGE_API_KEY: " ",
        R2_ACCOUNT_ID: "x",
        R2_ACCESS_KEY_ID: "x",
        R2_SECRET_ACCESS_KEY: "x",
      }),
    ).toEqual({ anthropic: true, voyage: false, r2: false });
  });
});
