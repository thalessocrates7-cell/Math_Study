import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { Check, PlotSpec, Step } from "../../content/types";

export const difficulty = pgEnum("difficulty", ["F", "C", "Ch"]);
export const rating = pgEnum("rating", ["got_it", "shaky", "lost", "skipped"]);
export const attemptOrigin = pgEnum("attempt_origin", ["plan", "review", "browse"]);
export const reviewReason = pgEnum("review_reason", ["got_it", "shaky", "lost", "similar", "easier"]);
export const reviewStatus = pgEnum("review_status", ["pending", "done"]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  /** Normalized "first|last" (trimmed, single-spaced, lowercase): one account per name. */
  nameKey: text("name_key").notNull().unique(),
  theme: text("theme").notNull().default("system"),
  createdAt: createdAt(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sections = pgTable("sections", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  objectives: jsonb("objectives").$type<string[]>().notNull(),
  concepts: jsonb("concepts").$type<Array<{ id: string; label: string }>>().notNull(),
  sort: integer("sort").notNull(),
  url: text("url").notNull(),
});

export const problems = pgTable(
  "problems",
  {
    id: text("id").primaryKey(),
    sectionId: text("section_id").notNull().references(() => sections.id),
    openstaxNumber: integer("openstax_number"),
    difficulty: difficulty("difficulty").notNull(),
    concepts: jsonb("concepts").$type<string[]>().notNull(),
    statement: text("statement").notNull(),
    figure: jsonb("figure").$type<PlotSpec | null>(),
    hints: jsonb("hints").$type<string[]>().notNull(),
    answer: text("answer").notNull(),
    steps: jsonb("steps").$type<Step[]>().notNull(),
    check: jsonb("check").$type<Check | Check[] | null>(),
    sort: integer("sort").notNull(),
    active: boolean("active").notNull().default(true),
    /** Set when an admin edits the problem, so re-seeding never overwrites their change. */
    editedByAdmin: boolean("edited_by_admin").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("problems_section_idx").on(t.sectionId, t.difficulty)],
);

export const planConfig = pgTable("plan_config", {
  sectionId: text("section_id").primaryKey().references(() => sections.id),
  foundation: integer("foundation").notNull(),
  core: integer("core").notNull(),
  challenge: integer("challenge").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assignments = pgTable(
  "assignments",
  {
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    problemId: text("problem_id").notNull().references(() => problems.id),
    sectionId: text("section_id").notNull().references(() => sections.id),
    position: integer("position").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.studentId, t.problemId] }),
    index("assignments_student_section_idx").on(t.studentId, t.sectionId),
  ],
);

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    problemId: text("problem_id").notNull().references(() => problems.id),
    origin: attemptOrigin("origin").notNull().default("plan"),
    reviewItemId: uuid("review_item_id"),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
    ratedAt: timestamp("rated_at", { withTimezone: true }),
    /** Calendar day of the rating in America/New_York (mastery needs Got It on two different days). */
    ratedDay: date("rated_day", { mode: "string" }),
    hintsShown: integer("hints_shown").notNull().default(0),
    hintUsed: boolean("hint_used").notNull().default(false),
    answerRevealed: boolean("answer_revealed").notNull().default(false),
    solutionViewed: boolean("solution_viewed").notNull().default(false),
    rating: rating("rating"),
    nextReviewDate: date("next_review_date", { mode: "string" }),
  },
  (t) => [
    index("attempts_student_idx").on(t.studentId, t.ratedAt),
    // At most one open (unrated) attempt per student and problem.
    uniqueIndex("attempts_one_open_idx").on(t.studentId, t.problemId).where(sql`${t.ratedAt} is null`),
  ],
);

export const reviewItems = pgTable(
  "review_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    problemId: text("problem_id").notNull().references(() => problems.id),
    sourceProblemId: text("source_problem_id").references(() => problems.id),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    reason: reviewReason("reason").notNull(),
    status: reviewStatus("status").notNull().default("pending"),
    createdAt: createdAt(),
    doneAt: timestamp("done_at", { withTimezone: true }),
  },
  (t) => [
    index("review_student_due_idx").on(t.studentId, t.status, t.dueDate),
    // At most one pending review per student and problem.
    uniqueIndex("review_one_pending_idx").on(t.studentId, t.problemId).where(sql`${t.status} = 'pending'`),
  ],
);

export const notes = pgTable(
  "notes",
  {
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    problemId: text("problem_id").notNull().references(() => problems.id),
    text: text("text").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.studentId, t.problemId] })],
);

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  examName: text("exam_name").notNull(),
  examDate: date("exam_date", { mode: "string" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminLoginAttempts = pgTable(
  "admin_login_attempts",
  {
    id: serial("id").primaryKey(),
    ipHash: text("ip_hash").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("admin_login_attempts_idx").on(t.ipHash, t.at)],
);

export type Student = typeof students.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type Problem = typeof problems.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type ReviewItem = typeof reviewItems.$inferSelect;
export type PlanConfigRow = typeof planConfig.$inferSelect;
export type Rating = NonNullable<Attempt["rating"]>;
export type ReviewReason = ReviewItem["reason"];
