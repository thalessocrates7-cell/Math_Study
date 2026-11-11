CREATE TYPE "public"."preparation" AS ENUM('exam4', 'final');--> statement-breakpoint
DROP INDEX "study_sessions_slot_idx";--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "preparation" "preparation" DEFAULT 'exam4' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "final_exam_name" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "final_exam_date" date;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "final_exam_time" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "final_availability" jsonb;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "final_exam_date_override" date;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD COLUMN "preparation" "preparation" DEFAULT 'exam4' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "study_sessions_slot_idx" ON "study_sessions" USING btree ("student_id","preparation","day","slot");