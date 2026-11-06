CREATE TYPE "public"."attempt_origin" AS ENUM('plan', 'review', 'browse');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('F', 'C', 'Ch');--> statement-breakpoint
CREATE TYPE "public"."rating" AS ENUM('got_it', 'shaky', 'lost', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."review_reason" AS ENUM('got_it', 'shaky', 'lost', 'similar', 'easier');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'done');--> statement-breakpoint
CREATE TABLE "admin_login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip_hash" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"student_id" uuid NOT NULL,
	"problem_id" text NOT NULL,
	"section_id" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "assignments_student_id_problem_id_pk" PRIMARY KEY("student_id","problem_id")
);
--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"problem_id" text NOT NULL,
	"origin" "attempt_origin" DEFAULT 'plan' NOT NULL,
	"review_item_id" uuid,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rated_at" timestamp with time zone,
	"rated_day" date,
	"hints_shown" integer DEFAULT 0 NOT NULL,
	"hint_used" boolean DEFAULT false NOT NULL,
	"answer_revealed" boolean DEFAULT false NOT NULL,
	"solution_viewed" boolean DEFAULT false NOT NULL,
	"rating" "rating",
	"next_review_date" date
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"student_id" uuid NOT NULL,
	"problem_id" text NOT NULL,
	"text" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notes_student_id_problem_id_pk" PRIMARY KEY("student_id","problem_id")
);
--> statement-breakpoint
CREATE TABLE "plan_config" (
	"section_id" text PRIMARY KEY NOT NULL,
	"foundation" integer NOT NULL,
	"core" integer NOT NULL,
	"challenge" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" text PRIMARY KEY NOT NULL,
	"section_id" text NOT NULL,
	"openstax_number" integer,
	"difficulty" "difficulty" NOT NULL,
	"concepts" jsonb NOT NULL,
	"statement" text NOT NULL,
	"figure" jsonb,
	"hints" jsonb NOT NULL,
	"answer" text NOT NULL,
	"steps" jsonb NOT NULL,
	"check" jsonb,
	"sort" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"edited_by_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"problem_id" text NOT NULL,
	"source_problem_id" text,
	"due_date" date NOT NULL,
	"reason" "review_reason" NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"done_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"objectives" jsonb NOT NULL,
	"concepts" jsonb NOT NULL,
	"sort" integer NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"exam_name" text NOT NULL,
	"exam_date" date NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"name_key" text NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_name_key_unique" UNIQUE("name_key")
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_config" ADD CONSTRAINT "plan_config_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problems" ADD CONSTRAINT "problems_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_source_problem_id_problems_id_fk" FOREIGN KEY ("source_problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_login_attempts_idx" ON "admin_login_attempts" USING btree ("ip_hash","at");--> statement-breakpoint
CREATE INDEX "assignments_student_section_idx" ON "assignments" USING btree ("student_id","section_id");--> statement-breakpoint
CREATE INDEX "attempts_student_idx" ON "attempts" USING btree ("student_id","rated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "attempts_one_open_idx" ON "attempts" USING btree ("student_id","problem_id") WHERE "attempts"."rated_at" is null;--> statement-breakpoint
CREATE INDEX "problems_section_idx" ON "problems" USING btree ("section_id","difficulty");--> statement-breakpoint
CREATE INDEX "review_student_due_idx" ON "review_items" USING btree ("student_id","status","due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "review_one_pending_idx" ON "review_items" USING btree ("student_id","problem_id") WHERE "review_items"."status" = 'pending';