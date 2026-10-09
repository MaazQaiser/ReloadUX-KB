import { describe, expect, it } from "vitest";
import { EnvError, parseServerEnv } from "./env";

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
