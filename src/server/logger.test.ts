import { describe, expect, it } from "vitest";
import type { LogLevel } from "@/env";
import { createLogger } from "./logger";

function capture(level: LogLevel = "debug") {
  const lines: { level: LogLevel; entry: Record<string, unknown> }[] = [];
  const logger = createLogger({
    level,
    now: () => new Date("2026-10-09T12:00:00.000Z"),
    write: (line, lineLevel) => lines.push({ level: lineLevel, entry: JSON.parse(line) }),
  });
  return { logger, lines };
}

describe("createLogger", () => {
  it("writes one JSON line with time, level, message and context", () => {
    const { logger, lines } = capture();
    logger.info("project saved", { projectId: "p1" });

    expect(lines).toEqual([
      {
        level: "info",
        entry: { time: "2026-10-09T12:00:00.000Z", level: "info", message: "project saved", projectId: "p1" },
      },
    ]);
  });

  it("drops lines below the configured level", () => {
    const { logger, lines } = capture("warn");
    logger.debug("a");
    logger.info("b");
    logger.warn("c");
    logger.error("d");

    expect(lines.map((line) => line.entry.message)).toEqual(["c", "d"]);
  });

  it("redacts secrets and personal data at any depth", () => {
    const { logger, lines } = capture();
    logger.info("request", {
      userId: "u1",
      email: "sara@reloadux.com",
      headers: { authorization: "Bearer abc", cookie: "session=xyz" },
      config: { MONGODB_URI: "mongodb+srv://u:p@host", apiKey: "sk-123", privateKey: "-----BEGIN" },
    });

    expect(lines[0]?.entry).toMatchObject({
      userId: "u1",
      email: "[redacted]",
      headers: { authorization: "[redacted]", cookie: "[redacted]" },
      config: { MONGODB_URI: "[redacted]", apiKey: "[redacted]", privateKey: "[redacted]" },
    });
    expect(JSON.stringify(lines)).not.toMatch(/abc|xyz|sk-123|u:p@host|sara@/);
  });

  it("serializes errors with name, message and stack", () => {
    const { logger, lines } = capture();
    logger.error("save failed", { error: new TypeError("bad input") });

    expect(lines[0]?.entry.error).toMatchObject({ name: "TypeError", message: "bad input" });
    expect(lines[0]?.entry.error).toHaveProperty("stack");
  });

  it("handles circular references without throwing", () => {
    const { logger, lines } = capture();
    const node: Record<string, unknown> = { id: "n1" };
    node.self = node;
    logger.info("loop", { node });

    expect(lines[0]?.entry.node).toEqual({ id: "n1", self: "[circular]" });
  });

  it("child loggers add their context to every line", () => {
    const { logger, lines } = capture();
    const requestLogger = logger.child({ requestId: "r1" });
    requestLogger.info("start");
    requestLogger.child({ step: "db" }).warn("slow", { ms: 900 });

    expect(lines.map((line) => line.entry)).toMatchObject([
      { message: "start", requestId: "r1" },
      { message: "slow", requestId: "r1", step: "db", ms: 900 },
    ]);
  });
});
