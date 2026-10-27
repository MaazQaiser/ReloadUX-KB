import { getTableName, sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { conversations, knowledgeGaps, people, projectChunks, projectDesigners, projects, tagValues, users, verifiedAnswers, visuals } from "@/server/db/schema";

const TABLES = [projectChunks, projectDesigners, visuals, projects, people, users, conversations, knowledgeGaps, verifiedAnswers, tagValues];

/** Empties every table, keeping the schema the setup file migrated. */
export async function resetDatabase(): Promise<void> {
  await (await getDb()).execute(sql.raw(`truncate ${TABLES.map((table) => `"${getTableName(table)}"`).join(", ")}`));
}

/** People rows with fixed ids, for tests whose projects point at made-up designers. */
export async function insertPeopleWithIds(ids: readonly string[]): Promise<void> {
  await (await getDb()).insert(people).values(
    ids.map((id, index) => ({ id, name: `Person ${index + 1}`, slug: `person-${index + 1}`, roles: ["designer"], updated_by: "system:test", updated_at: new Date() })),
  );
}
