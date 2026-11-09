import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
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
import type { Check, ConceptSeed, PlotSpec, Step } from "../../content/types";
import type { Availability } from "../lib/availability";
import type { Reason } from "../lib/reasons";
import type { RulesOverride } from "../lib/rules";

export const difficulty = pgEnum("difficulty", ["F", "C", "Ch"]);
export const rating = pgEnum("rating", ["got_it", "shaky", "lost", "skipped"]);
/**
 * Why an attempt was opened. plan = new learning, review = targeted reinforcement, browse = the student
 * opened it on their own, challenge = the daily Challenge, lookback = Regressive Study, extra = "Keep going".
 */
export const attemptOrigin = pgEnum("attempt_origin", ["plan", "review", "browse", "challenge", "lookback", "extra"]);
export const reviewReason = pgEnum("review_reason", ["got_it", "shaky", "lost", "similar", "easier"]);
export const reviewStatus = pgEnum("review_status", ["pending", "done"]);
export const sectionKind = pgEnum("section_kind", ["core", "supplementary"]);
export const problemSource = pgEnum("problem_source", ["openstax", "original", "professor"]);
export const sessionStatus = pgEnum("session_status", ["active", "paused", "completed"]);
export const itemTrack = pgEnum("item_track", ["challenge", "reinforcement", "new", "lookback", "extra"]);
export const itemStatus = pgEnum("item_status", ["pending", "active", "done", "skipped", "dropped"]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  /** Normalized "first|last" (trimmed, single-spaced, lowercase): one account per name. */
  nameKey: text("name_key").notNull().unique(),
  theme: text("theme").notNull().default("system"),
  /** Weekly study pattern from the schedule screen (null until the student sets it). */
  availability: jsonb("availability").$type<Availability | null>(),
  /** The student's own exam date (e.g. a make-up); null means the class date in settings. */
  examDateOverride: date("exam_date_override", { mode: "string" }),
  /** Include the supplementary sections (4.1, 4.2) in extra practice and look-backs. */
  supplementaryOptIn: boolean("supplementary_opt_in").notNull().default(false),
  /** When the student first saved a study schedule; null shows the setup screen. */
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  createdAt: createdAt(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sections = pgTable("sections", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  objectives: jsonb("objectives").$type<string[]>().notNull(),
  concepts: jsonb("concepts").$type<ConceptSeed[]>().notNull(),
  sort: integer("sort").notNull(),
  url: text("url").notNull(),
  kind: sectionKind("kind").notNull().default("core"),
  /** Set when an admin edits the section, so re-seeding never overwrites their change. */
  editedByAdmin: boolean("edited_by_admin").notNull().default(false),
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
    /** Admin's time estimate in minutes; null means the default for its difficulty. */
    estMinutes: integer("est_minutes"),
    source: problemSource("source").notNull().default("openstax"),
    /** Optional hand-picked follow-ups (otherwise they are matched by concept tags). */
    similarIds: jsonb("similar_ids").$type<string[]>().notNull().default([]),
    easierIds: jsonb("easier_ids").$type<string[]>().notNull().default([]),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("problems_section_idx").on(t.sectionId, t.difficulty)],
);

/** Unused since the adaptive planner (kept so old data and deploys stay valid). */
export const planConfig = pgTable("plan_config", {
  sectionId: text("section_id").primaryKey().references(() => sections.id),
  foundation: integer("foundation").notNull(),
  core: integer("core").notNull(),
  challenge: integer("challenge").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** The old fixed 15-per-section plans. Unused since the adaptive planner; kept for history. */
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
    /** Calendar day of the rating in America/New_York. */
    ratedDay: date("rated_day", { mode: "string" }),
    hintsShown: integer("hints_shown").notNull().default(0),
    hintUsed: boolean("hint_used").notNull().default(false),
    answerRevealed: boolean("answer_revealed").notNull().default(false),
    solutionViewed: boolean("solution_viewed").notNull().default(false),
    rating: rating("rating"),
    nextReviewDate: date("next_review_date", { mode: "string" }),
    /** Seconds the problem was on screen (the quiet timer). */
    activeSeconds: integer("active_seconds").notNull().default(0),
    /** The study-session item this attempt belongs to, if any. */
    sessionItemId: uuid("session_item_id"),
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

export type SessionSnapshot = {
  pacing: "ahead" | "on_track" | "tight" | "behind";
  challengeMode: "daily" | "bonus";
  unitId: string | null;
  finalReview: boolean;
};

/** One sitting of study: a planned list of items that fits the student's time. */
export const studySessions = pgTable(
  "study_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    /** New York calendar day the session belongs to. */
    day: date("day", { mode: "string" }).notNull(),
    /** 1 for the day's first session, 2 for the second, ... */
    slot: integer("slot").notNull(),
    budgetMinutes: integer("budget_minutes").notNull(),
    status: sessionStatus("status").notNull().default("active"),
    /** Started on a day that isn't in the student's schedule, or with a different length. */
    adHoc: boolean("ad_hoc").notNull().default(false),
    snapshot: jsonb("snapshot").$type<SessionSnapshot | null>(),
    createdAt: createdAt(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (t) => [
    // Starting twice (a double click, two tabs) can't create two sessions in the same slot.
    uniqueIndex("study_sessions_slot_idx").on(t.studentId, t.day, t.slot),
  ],
);

export const sessionItems = pgTable(
  "session_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id").notNull().references(() => studySessions.id, { onDelete: "cascade" }),
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    track: itemTrack("track").notNull(),
    problemId: text("problem_id").notNull().references(() => problems.id),
    /** The targeted-reinforcement item this answers, if any. */
    reviewItemId: uuid("review_item_id"),
    /** Why the planner chose it; rendered by src/lib/reasons.ts. */
    reason: jsonb("reason").$type<Reason>().notNull(),
    /** Estimated minutes for this student when it was planned. */
    minutes: integer("minutes").notNull(),
    /** Part of the planned session (false = optional, e.g. a bonus or Keep going). */
    essential: boolean("essential").notNull().default(true),
    status: itemStatus("status").notNull().default("pending"),
    attemptId: uuid("attempt_id"),
    createdAt: createdAt(),
    doneAt: timestamp("done_at", { withTimezone: true }),
  },
  (t) => [
    index("session_items_session_idx").on(t.sessionId, t.position),
    index("session_items_student_idx").on(t.studentId, t.createdAt),
  ],
);

/** Running class-wide solving times per problem (geometric mean = exp(sumLogSeconds / n)). */
export const problemTimeStats = pgTable("problem_time_stats", {
  problemId: text("problem_id")
    .primaryKey()
    .references(() => problems.id, { onDelete: "cascade" }),
  n: integer("n").notNull().default(0),
  sumLogSeconds: doublePrecision("sum_log_seconds").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  examName: text("exam_name").notNull(),
  examDate: date("exam_date", { mode: "string" }).notNull(),
  /** Overrides for the study-plan rules (src/lib/rules.ts); anything missing uses the default. */
  rules: jsonb("rules").$type<RulesOverride>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminLoginAttempts = pgTable(
  "admin_login_attempts",
  {
    id: serial("id").primaryKey(),
    ipHash: text("ip_hash").notNull(),
    /** "admin" = a wrong admin code; "student" = a student sign-in (rate limit per network). */
    kind: text("kind").notNull().default("admin"),
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
export type StudySession = typeof studySessions.$inferSelect;
export type SessionItem = typeof sessionItems.$inferSelect;
export type Rating = NonNullable<Attempt["rating"]>;
export type ReviewReason = ReviewItem["reason"];
export type AttemptOrigin = Attempt["origin"];
export type ItemTrack = SessionItem["track"];
export type ItemStatus = SessionItem["status"];
