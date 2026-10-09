import { MongoMemoryReplSet } from "mongodb-memory-server";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

// A single-node replica set, not a standalone server, so transactions and
// change streams behave as they do on Atlas.
export default async function setup(project: TestProject) {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  project.provide("mongoUri", replSet.getUri());

  return async () => {
    await replSet.stop();
  };
}
