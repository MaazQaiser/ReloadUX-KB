import "server-only";

/** Collection names in one place so a typo can't create a stray collection. */
export const COLLECTIONS = {
  projects: "projects",
  people: "people",
  users: "users",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
