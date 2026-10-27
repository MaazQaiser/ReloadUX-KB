import { parseArgs } from "node:util";
import { getAiConfig } from "@/env";
import { closeDb } from "@/server/db/client";
import { logger } from "@/server/logger";
import { listAllVisibleProjects, listDraftProjects } from "@/server/repositories/projects";
import { indexProject, planProjectIndex } from "@/server/services/project-index";
import { getTagCatalog } from "@/server/services/tags";

/**
 * Brings every project's search chunks up to date: embeds new or edited text,
 * reuses everything else. Safe to run twice; --dry-run only reports counts.
 * Use it after connecting Voyage, changing the embedding model, or when a
 * save logged "project indexing failed".
 */
async function main(): Promise<number> {
  const { values } = parseArgs({ options: { "dry-run": { type: "boolean", default: false } }, strict: true });
  const dryRun = values["dry-run"];
  const log = logger.child({ script: "embed-projects", dryRun });

  if (!dryRun && !getAiConfig().voyageApiKey) {
    log.error("VOYAGE_API_KEY isn't set in .env.local; nothing embedded");
    return 1;
  }

  const catalog = await getTagCatalog();
  const projects = [...(await listAllVisibleProjects()), ...(await listDraftProjects())];
  let toEmbed = 0;
  let failed = 0;

  for (const project of projects) {
    if (dryRun) {
      const { chunks, missing } = await planProjectIndex(project, catalog);
      toEmbed += missing.length;
      log.info("project", { slug: project.slug, chunks: chunks.length, toEmbed: missing.length });
      continue;
    }
    const outcome = await indexProject(project, catalog);
    if (outcome.status === "indexed") toEmbed += outcome.embedded;
    else failed += 1;
    log.info("project", { slug: project.slug, ...outcome });
  }

  log.info(dryRun ? "dry run complete, nothing written" : "embedding complete", { projects: projects.length, embedded: toEmbed, failed });
  return failed > 0 ? 1 : 0;
}

main()
  .catch((error: unknown) => {
    logger.error("embed-projects failed", { error });
    return 1;
  })
  .then(async (code) => {
    await closeDb();
    process.exitCode = code;
  });
