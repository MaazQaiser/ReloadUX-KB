CREATE TABLE "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"turn_id" text NOT NULL,
	"user_id" text NOT NULL,
	"question" text NOT NULL,
	"verdict" text,
	"project_slugs" text[] NOT NULL,
	"tools_called" text[] NOT NULL,
	"latency_ms" integer NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"preview" boolean NOT NULL,
	"feedback" jsonb,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_gaps" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"reason" text NOT NULL,
	"note" text,
	"turn_id" text,
	"user_id" text NOT NULL,
	"status" text NOT NULL,
	"resolution" jsonb,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"email" text,
	"roles" text[] NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "project_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"field" text NOT NULL,
	"ordinal" integer NOT NULL,
	"text" text NOT NULL,
	"hash" text NOT NULL,
	"embedding" vector(1024) NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_designers" (
	"project_id" text NOT NULL,
	"person_id" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "project_designers_project_id_person_id_pk" PRIMARY KEY("project_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"client_name" text,
	"industry" text NOT NULL,
	"country" text,
	"status" text NOT NULL,
	"nda" boolean DEFAULT false NOT NULL,
	"product_types" text[] DEFAULT '{}'::text[] NOT NULL,
	"services" text[] DEFAULT '{}'::text[] NOT NULL,
	"ai_features" text[] DEFAULT '{}'::text[] NOT NULL,
	"flows" text[] DEFAULT '{}'::text[] NOT NULL,
	"business_model" text[] DEFAULT '{}'::text[] NOT NULL,
	"personas" text[] DEFAULT '{}'::text[] NOT NULL,
	"lead_designer" text NOT NULL,
	"account_manager" text,
	"delivered_to" jsonb,
	"start_date" timestamp with time zone,
	"delivery_date" timestamp with time zone,
	"duration_weeks" double precision,
	"milestones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"figma_files" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prototype_url" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"live_url" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"case_study_url" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"drive_folder" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"visuals" text[] DEFAULT '{}'::text[] NOT NULL,
	"summary" text NOT NULL,
	"challenge" text,
	"what_we_did" text,
	"outcomes" text,
	"testimonial" text,
	"metrics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"public_summary" text,
	"search_text" text,
	"search_document" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(name, '')), 'A') || setweight(to_tsvector('english', coalesce(client_name, '')), 'B') || setweight(to_tsvector('english', coalesce(search_text, '')), 'D')) STORED,
	"review_status" text NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tag_values" (
	"id" text PRIMARY KEY NOT NULL,
	"list" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"firebase_uid" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"photo_url" text,
	"designation" text,
	"created_at" timestamp with time zone NOT NULL,
	"last_sign_in_at" timestamp with time zone NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verified_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"project_slugs" text[] NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "visuals" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"image_key" text NOT NULL,
	"source" text NOT NULL,
	"order" integer NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	"caption" text,
	"flow" text,
	"figma_link" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "project_chunks" ADD CONSTRAINT "project_chunks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_designers" ADD CONSTRAINT "project_designers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_designers" ADD CONSTRAINT "project_designers_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_lead_designer_people_id_fk" FOREIGN KEY ("lead_designer") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_account_manager_people_id_fk" FOREIGN KEY ("account_manager") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visuals" ADD CONSTRAINT "visuals_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_turn_id_unique" ON "conversations" USING btree ("turn_id");--> statement-breakpoint
CREATE INDEX "conversations_created_at" ON "conversations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "knowledge_gaps_status_created" ON "knowledge_gaps" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "people_slug_unique" ON "people" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "project_chunks_project_field" ON "project_chunks" USING btree ("project_id","field","ordinal");--> statement-breakpoint
CREATE INDEX "project_chunks_embedding" ON "project_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "project_designers_person" ON "project_designers" USING btree ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_slug_unique" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "projects_search_document" ON "projects" USING gin ("search_document");--> statement-breakpoint
CREATE INDEX "projects_product_types" ON "projects" USING gin ("product_types");--> statement-breakpoint
CREATE INDEX "projects_ai_features" ON "projects" USING gin ("ai_features");--> statement-breakpoint
CREATE INDEX "projects_flows" ON "projects" USING gin ("flows");--> statement-breakpoint
CREATE INDEX "projects_business_model" ON "projects" USING gin ("business_model");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_values_list_key_unique" ON "tag_values" USING btree ("list","key");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_firebase_uid_unique" ON "users" USING btree ("firebase_uid");--> statement-breakpoint
CREATE INDEX "visuals_project_order" ON "visuals" USING btree ("project_id","order");