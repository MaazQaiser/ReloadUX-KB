import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { MongoMemoryServer } from "mongodb-memory-server";
import type { User } from "@/schemas/user";
import type { TurnSummary } from "@/server/services/agent-answer";
import { logger } from "@/server/logger";
import { evalSetSchema, grade, type CaseOutput, type EvalCase, type Grade } from "./grade";

/**
 * `pnpm eval [--reps N] [--only id,id] [--tags tag,tag] [--concurrency N]`
 *
 * Runs every case through the app's real answer path (streamAgentAnswer)
 * against a throwaway seeded database, grades it, and writes results.jsonl,
 * errors.jsonl (attempts that never produced a gradable answer: API or
 * infrastructure failures and timeouts) and summary.json under
 * evals/results/<timestamp>/. Calls Claude, so each run costs money.
 */

const log = logger.child({ script: "eval" });
// Upper-bound pricing for claude-opus-5-5 (per million tokens). Cache reads are cheaper, so real cost is lower.
const PRICE_PER_MTOK = { input: 4, output: 20 };
const CASE_CEILING_MS = 150_000;
const EVAL_USER = { id: "64b7f0c2a1b2c3d4e5f60aaa", role: "admin", name: "Eval runner", email: "eval@example.com" } as User;

interface Row {
  case_id: string;
  rep: number;
  tags: string[];
  status: "ok" | "refused" | "no_answer" | "truncated";
  grade: Grade;
  verdict: CaseOutput["verdict"];
  cited: string[];
  text: string;
  tools: string[];
  models: string[];
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
}

function wilson(passed: number, total: number): [number, number] {
  if (total === 0) return [0, 0];
  const z = 1.96;
  const p = passed / total;
  const centre = (p + (z * z) / (2 * total)) / (1 + (z * z) / total);
  const half = (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / (1 + (z * z) / total);
  return [Number(Math.max(0, centre - half).toFixed(3)), Number(Math.min(1, centre + half).toFixed(3))];
}

const rate = (rows: Row[], pick: (row: Row) => boolean | null) => {
  const applicable = rows.map(pick).filter((value): value is boolean => value !== null);
  return { n: applicable.length, rate: applicable.length ? Number((applicable.filter(Boolean).length / applicable.length).toFixed(3)) : null };
};

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      reps: { type: "string", default: "1" },
      only: { type: "string" },
      tags: { type: "string" },
      concurrency: { type: "string", default: "3" },
    },
    strict: true,
  });
  const reps = Math.max(1, Number(values.reps));
  const concurrency = Math.max(1, Number(values.concurrency));

  // The database must be ours before any module reads MONGODB_URI.
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.MONGODB_DB = "eval";

  const [{ getClaude }, { AI_CONFIG }, { getDb, closeMongoClient }, { syncIndexes }, { seedDatabase }, { streamAgentAnswer }] = await Promise.all([
    import("@/server/ai/claude"),
    import("@/server/ai/config"),
    import("@/server/db/client"),
    import("@/server/db/indexes"),
    import("../seed/run"),
    import("@/server/services/agent-answer"),
  ]);

  try {
    const client = getClaude();
    if (!client) {
      log.error("ANTHROPIC_API_KEY isn't set in .env.local; the eval needs the real agent");
      return 1;
    }
    // Bound after the check so the case runner below sees a client, not a possible null.
    const agent = client;

    const set = evalSetSchema.parse(JSON.parse(readFileSync("evals/evals.json", "utf8")));
    const only = values.only?.split(",");
    const tags = values.tags?.split(",");
    const cases = set.cases.filter((c) => (!only || only.includes(c.id)) && (!tags || c.tags.some((tag) => tags.includes(tag))));

    await syncIndexes(await getDb(), { dryRun: false });
    await seedDatabase({ dryRun: false, log: log.child({ step: "seed" }) });

    const runDir = join("evals", "results", new Date().toISOString().replace(/[:.]/g, "-"));
    mkdirSync(runDir, { recursive: true });
    const rows: Row[] = [];
    const errors: { case_id: string; rep: number; kind: string; detail: string }[] = [];

    async function runOne(testCase: EvalCase, rep: number) {
      const startedAt = Date.now();
      let summary: TurnSummary | undefined;
      const output: CaseOutput = { answered: false, verdict: null, cited: [], text: "" };
      const ceiling = new AbortController();
      const timer = setTimeout(() => ceiling.abort(), CASE_CEILING_MS);
      try {
        for await (const event of streamAgentAnswer(agent, testCase.question, testCase.history, EVAL_USER, ceiling.signal, (s) => (summary = s))) {
          if (event.type === "answer") {
            output.verdict = event.verdict;
            output.cited = event.projects.map((project) => project.slug);
          } else if (event.type === "text") output.text += event.delta;
          else if (event.type === "done") output.answered = true;
        }
      } catch (error) {
        errors.push({ case_id: testCase.id, rep, kind: "harness", detail: String(error) });
        return;
      } finally {
        clearTimeout(timer);
      }

      if (ceiling.signal.aborted || !summary) {
        errors.push({ case_id: testCase.id, rep, kind: "timeout", detail: `no result within ${CASE_CEILING_MS / 1000}s` });
        return;
      }
      if (summary.failure === "error" || summary.failure === "timeout") {
        errors.push({ case_id: testCase.id, rep, kind: summary.failure, detail: "API or infrastructure failure; see server logs" });
        return;
      }
      const unexpected = summary.usage.models.filter((model) => !model.startsWith(AI_CONFIG.agent.model));
      if (unexpected.length > 0) log.warn("a response was served by another model (refusal fallback)", { case: testCase.id, models: summary.usage.models });

      rows.push({
        case_id: testCase.id,
        rep,
        tags: testCase.tags,
        status: summary.failure ?? "ok",
        grade: grade(testCase, output),
        verdict: output.verdict,
        cited: output.cited,
        text: output.text,
        tools: summary.toolsCalled,
        models: summary.usage.models,
        input_tokens: summary.usage.input,
        output_tokens: summary.usage.output,
        latency_ms: Date.now() - startedAt,
      });
      log.info("case", { case: testCase.id, rep, pass: rows.at(-1)?.grade.pass, status: summary.failure ?? "ok" });
    }

    const queue = cases.flatMap((testCase) => Array.from({ length: reps }, (_, rep) => ({ testCase, rep })));
    await Promise.all(
      Array.from({ length: concurrency }, async () => {
        for (let next = queue.shift(); next; next = queue.shift()) await runOne(next.testCase, next.rep);
      }),
    );

    rows.sort((a, b) => a.case_id.localeCompare(b.case_id) || a.rep - b.rep);
    const passed = rows.filter((row) => row.grade.pass).length;
    const input = rows.reduce((sum, row) => sum + row.input_tokens, 0);
    const output = rows.reduce((sum, row) => sum + row.output_tokens, 0);
    const latencies = rows.map((row) => row.latency_ms).sort((a, b) => a - b);
    const summary = {
      prompt: (await import("@/server/agent/prompts/system-v1")).PROMPT_VERSION,
      model: AI_CONFIG.agent.model,
      cases: cases.length,
      reps,
      graded: rows.length,
      errors: errors.length,
      pass_rate: rows.length ? Number((passed / rows.length).toFixed(3)) : null,
      pass_rate_95ci: wilson(passed, rows.length),
      top3_accuracy: rate(rows, (row) => row.grade.checks.top3),
      verdict_accuracy: rate(rows, (row) => row.grade.checks.verdict),
      mentions_accuracy: rate(rows, (row) => row.grade.checks.mentions),
      invented_facts: rows.filter((row) => row.grade.checks.no_forbidden === false).map((row) => ({ case: row.case_id, rep: row.rep, forbidden: row.grade.forbidden })),
      refusals: rows.filter((row) => row.status === "refused").length,
      no_answer: rows.filter((row) => row.status === "no_answer" || row.status === "truncated").length,
      tokens: { input, output },
      cost_usd_upper_bound: Number(((input * PRICE_PER_MTOK.input + output * PRICE_PER_MTOK.output) / 1_000_000).toFixed(2)),
      latency_ms: { median: latencies[Math.floor(latencies.length / 2)] ?? null, p90: latencies[Math.floor(latencies.length * 0.9)] ?? null },
      failed_cases: rows.filter((row) => !row.grade.pass).map((row) => ({ case: row.case_id, rep: row.rep, status: row.status, missing: row.grade.missing, forbidden: row.grade.forbidden, verdict: row.verdict, cited: row.cited })),
    };

    writeFileSync(join(runDir, "results.jsonl"), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
    writeFileSync(join(runDir, "errors.jsonl"), errors.map((error) => JSON.stringify(error)).join("\n") + (errors.length ? "\n" : ""));
    writeFileSync(join(runDir, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
    log.info("eval complete", { dir: runDir, ...summary, failed_cases: summary.failed_cases.length });
    return 0;
  } finally {
    await closeMongoClient();
    await mongo.stop();
  }
}

main()
  .catch((error: unknown) => {
    log.error("eval failed", { error });
    return 1;
  })
  .then((code) => {
    process.exitCode = code;
  });
