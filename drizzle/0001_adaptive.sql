CREATE TYPE "public"."item_status" AS ENUM('pending', 'active', 'done', 'skipped', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."item_track" AS ENUM('challenge', 'reinforcement', 'new', 'lookback', 'extra');--> statement-breakpoint
CREATE TYPE "public"."problem_source" AS ENUM('openstax', 'original', 'professor');--> statement-breakpoint
CREATE TYPE "public"."section_kind" AS ENUM('core', 'supplementary');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('active', 'paused', 'completed');--> statement-breakpoint
ALTER TYPE "public"."attempt_origin" ADD VALUE 'challenge';--> statement-breakpoint
ALTER TYPE "public"."attempt_origin" ADD VALUE 'lookback';--> statement-breakpoint
ALTER TYPE "public"."attempt_origin" ADD VALUE 'extra';--> statement-breakpoint
CREATE TABLE "problem_time_stats" (
	"problem_id" text PRIMARY KEY NOT NULL,
	"n" integer DEFAULT 0 NOT NULL,
	"sum_log_seconds" double precision DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"track" "item_track" NOT NULL,
	"problem_id" text NOT NULL,
	"review_item_id" uuid,
	"reason" jsonb NOT NULL,
	"minutes" integer NOT NULL,
	"essential" boolean DEFAULT true NOT NULL,
	"status" "item_status" DEFAULT 'pending' NOT NULL,
	"attempt_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"done_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "study_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"day" date NOT NULL,
	"slot" integer NOT NULL,
	"budget_minutes" integer NOT NULL,
	"status" "session_status" DEFAULT 'active' NOT NULL,
	"ad_hoc" boolean DEFAULT false NOT NULL,
	"snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "admin_login_attempts" ADD COLUMN "kind" text DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "active_seconds" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "session_item_id" uuid;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "est_minutes" integer;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "source" "problem_source" DEFAULT 'openstax' NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "similar_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "easier_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "kind" "section_kind" DEFAULT 'core' NOT NULL;--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "edited_by_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "rules" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "availability" jsonb;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "exam_date_override" date;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "supplementary_opt_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "onboarded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "problem_time_stats" ADD CONSTRAINT "problem_time_stats_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_items" ADD CONSTRAINT "session_items_session_id_study_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."study_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_items" ADD CONSTRAINT "session_items_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_items" ADD CONSTRAINT "session_items_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_items_session_idx" ON "session_items" USING btree ("session_id","position");--> statement-breakpoint
CREATE INDEX "session_items_student_idx" ON "session_items" USING btree ("student_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "study_sessions_slot_idx" ON "study_sessions" USING btree ("student_id","day","slot");--> statement-breakpoint
-- Data step: Regressive Study (look-backs) replaces the old "Got it -> same problem in 14 days" review. The history stays in attempts.
UPDATE "review_items" SET "status" = 'done', "done_at" = now() WHERE "status" = 'pending' AND "reason" = 'got_it';--> statement-breakpoint
-- Data step: problems without an OpenStax exercise number are this site's original practice problems.
UPDATE "problems" SET "source" = 'original' WHERE "openstax_number" IS NULL;
