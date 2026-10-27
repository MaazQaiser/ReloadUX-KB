import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  vector,
} from "drizzle-orm/pg-core";

/**
 * Every table the app uses. Change it here, then `pnpm db:generate` writes a
 * migration and `pnpm db:migrate` applies it (CLAUDE.md: indexes in code).
 * Ids are the app's 24-character hex strings, so ids look the same everywhere.
 * Zod schemas stay the source of types; repositories validate rows into them.
 */

// Mirrors AI_CONFIG.voyage.dimensions (this file is also read by drizzle-kit, outside the app).
export const EMBEDDING_DIMENSIONS = 1024;

const tsvector = customType<{ data: string }>({ dataType: () => "tsvector" });
const id = () => text("id").primaryKey();
const timestamps = {
  updated_by: text("updated_by").notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull(),
};
const tagList = (name: string) => text(name).array().notNull().default(sql`'{}'::text[]`);
const links = (name: string) => jsonb(name).$type<{ label: string; url: string }[]>().notNull().default([]);

export const people = pgTable(
  "people",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    email: text("email"),
    roles: text("roles").array().notNull(),
    active: boolean("active").notNull().default(true),
    ...timestamps,
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("people_slug_unique").on(table.slug)],
);

export const projects = pgTable(
  "projects",
  {
    id: id(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    client_name: text("client_name"),
    industry: text("industry").notNull(),
    country: text("country"),
    status: text("status").notNull(),
    nda: boolean("nda").notNull().default(false),
    product_types: tagList("product_types"),
    services: tagList("services"),
    ai_features: tagList("ai_features"),
    flows: tagList("flows"),
    business_model: tagList("business_model"),
    personas: tagList("personas"),
    lead_designer: text("lead_designer")
      .notNull()
      .references(() => people.id),
    account_manager: text("account_manager").references(() => people.id),
    delivered_to: jsonb("delivered_to").$type<{ name: string; role?: string }>(),
    start_date: timestamp("start_date", { withTimezone: true }),
    delivery_date: timestamp("delivery_date", { withTimezone: true }),
    duration_weeks: doublePrecision("duration_weeks"),
    milestones: jsonb("milestones").$type<{ name: string; date: string }[]>().notNull().default([]),
    figma_files: links("figma_files"),
    prototype_url: links("prototype_url"),
    live_url: links("live_url"),
    case_study_url: links("case_study_url"),
    drive_folder: links("drive_folder"),
    // The project's screenshots in gallery order, kept in step with the visuals table.
    visuals: text("visuals").array().notNull().default(sql`'{}'::text[]`),
    summary: text("summary").notNull(),
    challenge: text("challenge"),
    what_we_did: text("what_we_did"),
    outcomes: text("outcomes"),
    testimonial: text("testimonial"),
    metrics: jsonb("metrics").$type<{ label: string; value: string }[]>().notNull().default([]),
    public_summary: text("public_summary"),
    search_text: text("search_text"),
    // Keyword search: names weigh most, then the client, then everything search_text covers.
    search_document: tsvector("search_document").generatedAlwaysAs(
      sql`setweight(to_tsvector('english', coalesce(name, '')), 'A') || setweight(to_tsvector('english', coalesce(client_name, '')), 'B') || setweight(to_tsvector('english', coalesce(search_text, '')), 'D')`,
    ),
    review_status: text("review_status").notNull(),
    ...timestamps,
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("projects_slug_unique").on(table.slug),
    index("projects_search_document").using("gin", table.search_document),
    index("projects_product_types").using("gin", table.product_types),
    index("projects_ai_features").using("gin", table.ai_features),
    index("projects_flows").using("gin", table.flows),
    index("projects_business_model").using("gin", table.business_model),
  ],
);

/** A project's other designers, in the order the form lists them. */
export const projectDesigners = pgTable(
  "project_designers",
  {
    project_id: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    person_id: text("person_id")
      .notNull()
      .references(() => people.id),
    position: integer("position").notNull(),
  },
  (table) => [primaryKey({ columns: [table.project_id, table.person_id] }), index("project_designers_person").on(table.person_id)],
);

export const users = pgTable(
  "users",
  {
    id: id(),
    firebase_uid: text("firebase_uid").notNull(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    photo_url: text("photo_url"),
    designation: text("designation"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull(),
    last_sign_in_at: timestamp("last_sign_in_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email), uniqueIndex("users_firebase_uid_unique").on(table.firebase_uid)],
);

export const visuals = pgTable(
  "visuals",
  {
    id: id(),
    project_id: text("project_id")
      .notNull()
      .references(() => projects.id),
    image_key: text("image_key").notNull(),
    source: text("source").notNull(),
    order: integer("order").notNull(),
    is_cover: boolean("is_cover").notNull().default(false),
    caption: text("caption"),
    flow: text("flow"),
    figma_link: text("figma_link"),
    created_by: text("created_by").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull(),
    ...timestamps,
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("visuals_project_order").on(table.project_id, table.order)],
);

export const conversations = pgTable(
  "conversations",
  {
    id: id(),
    turn_id: text("turn_id").notNull(),
    user_id: text("user_id").notNull(),
    question: text("question").notNull(),
    verdict: text("verdict"),
    project_slugs: text("project_slugs").array().notNull(),
    tools_called: text("tools_called").array().notNull(),
    latency_ms: integer("latency_ms").notNull(),
    input_tokens: integer("input_tokens"),
    output_tokens: integer("output_tokens"),
    preview: boolean("preview").notNull(),
    feedback: jsonb("feedback").$type<{ rating: "up" | "down"; note?: string; at: string }>(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("conversations_turn_id_unique").on(table.turn_id), index("conversations_created_at").on(table.created_at)],
);

export const knowledgeGaps = pgTable(
  "knowledge_gaps",
  {
    id: id(),
    question: text("question").notNull(),
    reason: text("reason").notNull(),
    note: text("note"),
    turn_id: text("turn_id"),
    user_id: text("user_id").notNull(),
    status: text("status").notNull(),
    resolution: jsonb("resolution").$type<{ type: string; note?: string; by: string; at: string }>(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("knowledge_gaps_status_created").on(table.status, table.created_at)],
);

export const verifiedAnswers = pgTable("verified_answers", {
  id: id(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  project_slugs: text("project_slugs").array().notNull(),
  created_by: text("created_by").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull(),
  ...timestamps,
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
});

export const tagValues = pgTable(
  "tag_values",
  {
    id: id(),
    list: text("list").notNull(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    created_by: text("created_by").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("tag_values_list_key_unique").on(table.list, table.key)],
);

/** Search chunks: a project's profile and story, each with its Voyage embedding (SPEC decisions log). */
export const projectChunks = pgTable(
  "project_chunks",
  {
    id: id(),
    project_id: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    field: text("field").notNull(),
    ordinal: integer("ordinal").notNull(),
    text: text("text").notNull(),
    hash: text("hash").notNull(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("project_chunks_project_field").on(table.project_id, table.field, table.ordinal),
    index("project_chunks_embedding").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ],
);
