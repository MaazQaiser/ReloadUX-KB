import { projectInputSchema } from "@/schemas/project";
import { personInputSchema } from "@/schemas/person";
import { getDb } from "@/server/db/client";
import { syncIndexes } from "@/server/db/indexes";
import type { Logger } from "@/server/logger";
import { savePerson } from "@/server/services/people";
import { saveProject } from "@/server/services/projects";
import { SEED_PEOPLE, SEED_PROJECTS, type SeedProject } from "./data";

const ACTOR = "system:seed";
// Stands in for real ids during a dry run, when people haven't been saved.
const PLACEHOLDER_ID = "000000000000000000000000";

export interface SeedSummary {
  people: number;
  projects: number;
  dryRun: boolean;
}

export class SeedError extends Error {
  constructor(message: string, readonly details: unknown) {
    super(message);
    this.name = "SeedError";
  }
}

function resolvePeople(project: SeedProject, idFor: (slug: string) => string) {
  return {
    ...project,
    lead_designer: idFor(project.lead_designer),
    designers: (project.designers ?? []).map(idFor),
    account_manager: project.account_manager && idFor(project.account_manager),
  };
}

function validateOnly(log: Logger): SeedSummary {
  const knownSlugs = new Set(SEED_PEOPLE.map((person) => person.slug));
  for (const person of SEED_PEOPLE) personInputSchema.parse(person);
  for (const project of SEED_PROJECTS) {
    const resolved = resolvePeople(project, (slug) => {
      if (!knownSlugs.has(slug)) throw new SeedError(`unknown person "${slug}"`, { project: project.slug });
      return PLACEHOLDER_ID;
    });
    projectInputSchema.parse(resolved);
  }
  log.info("dry run: seed data is valid, nothing written", { people: SEED_PEOPLE.length, projects: SEED_PROJECTS.length });
  return { people: SEED_PEOPLE.length, projects: SEED_PROJECTS.length, dryRun: true };
}

/** Upserts every seed record by slug, so running it again changes nothing new. */
export async function seedDatabase({ dryRun, log }: { dryRun: boolean; log: Logger }): Promise<SeedSummary> {
  if (dryRun) return validateOnly(log);

  await syncIndexes(await getDb(), { dryRun: false });

  const idBySlug = new Map<string, string>();
  for (const input of SEED_PEOPLE) {
    const result = await savePerson(input, ACTOR);
    if (!result.ok) throw new SeedError(`person "${input.slug}" is invalid`, result.error);
    idBySlug.set(result.value.slug, result.value.id);
  }

  for (const project of SEED_PROJECTS) {
    const input = resolvePeople(project, (slug) => {
      const id = idBySlug.get(slug);
      if (!id) throw new SeedError(`unknown person "${slug}"`, { project: project.slug });
      return id;
    });
    const result = await saveProject(input, { actor: ACTOR, reviewStatus: "approved" });
    if (!result.ok) throw new SeedError(`project "${project.slug}" was not saved`, result.error);
  }

  log.info("seeded", { people: SEED_PEOPLE.length, projects: SEED_PROJECTS.length });
  return { people: SEED_PEOPLE.length, projects: SEED_PROJECTS.length, dryRun: false };
}
