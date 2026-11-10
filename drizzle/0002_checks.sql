CREATE TABLE "problem_checks" (
	"student_id" uuid NOT NULL,
	"problem_id" text NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "problem_checks_student_id_problem_id_pk" PRIMARY KEY("student_id","problem_id")
);
--> statement-breakpoint
ALTER TABLE "problem_checks" ADD CONSTRAINT "problem_checks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_checks" ADD CONSTRAINT "problem_checks_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Data step: every problem a student has already rated (not skipped) starts out ticked on the Study Plan.
INSERT INTO "problem_checks" ("student_id", "problem_id", "checked_at")
SELECT "student_id", "problem_id", min("rated_at") FROM "attempts"
WHERE "rated_at" IS NOT NULL AND "rating" IN ('got_it', 'shaky', 'lost')
GROUP BY "student_id", "problem_id"
ON CONFLICT DO NOTHING;
