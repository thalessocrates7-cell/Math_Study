# Adaptive study system: progress and what's left

Last updated: **2026-11-10 (Tue)**. Exam 4 is **Wed 2026-12-02**; the Final Exam is **Mon 2026-12-14, 2:00 PM**.

- **Approved plan:** `C:\Users\thale\.claude\plans\c-users-thale-donloads-mth-263-calculus-federated-moth.md`.
- **Older handoff:** `PROJECT_CONTEXT.md`, which describes the site as it was before this work.

## Final Exam environment (2026-11-10): branch `final-exam` (commit `ca9426b`, not pushed), NOT live

Brief: `Downloads\MTH263_Final_Exam_Route_and_Dashboard_Brief.docx`. Plan: `~/.claude/plans/c-users-thale-downloads-mth263-final-exa-shimmering-wolf.md`.
Git: `main` = `adaptive` = `8734896` (live). `final-exam` was branched from it. The work is committed there (`ca9426b`), after every check below passed.

**Your answers (2026-11-10):**
- Final Exam is a replica of the current pages for the final.
- Inside it, the item under Settings says **Integration Review** and goes back.
- The Final Exam has its own study schedule.
- The 77-question pool is an initial pool and may grow.
- The exam is 2:00 PM Eastern, editable by the admin.
- This step builds the pages and the separate data; the question import comes later.

**What it does:**
- `/final-exam` (+ `/plan`, `/review`, `/progress`, `/session`, `/settings`, `/schedule`, `/practice/[id]`) are the same pages as the regular site. They come from shared views in `src/components/views/*View.tsx`, and every route passes `prep="exam4"` or `prep="final"`.
- Sidebar: **Final Exam** (graduation cap) sits directly under Settings. Inside the Final Exam, **Integration Review** takes that place, and the brand reads "MTH 263 Final Exam". On phones the top bar has the same switch, so the tab bar keeps its 5 items.
- Way back: clicking Final Exam saves the exact page in a session cookie (`mth_return`, checked by `safeReturnPath` in `src/lib/prep.ts`). Integration Review and the Dashboard's "Back to Integration Review" return there, or to `/dashboard` when nothing is saved.
- A practice problem opened under the other environment's address moves to its own address.

**Data (migration `0003_final_exam.sql`, additive):**
- New enum `preparation` (`exam4` | `final`) on `sections` and `study_sessions`. Every existing row becomes `exam4`.
- The session slot index is now (student, preparation, day, slot), so both environments can have a "session 1" on the same day.
- `students.final_availability` and `final_exam_date_override` hold the Final Exam's own schedule and date.
- `settings.final_exam_name`, `final_exam_date` and `final_exam_time` are null until set, falling back to `content/final-exam.ts`: Final Exam, 2026-12-14, 14:00.
- A problem belongs to its section's preparation, so attempts, reviews and ticks are separated through the problem (`src/server/prep.ts`). No column was added to those tables, because a second column could disagree with the section.
- The Final Exam's chapters are seeded as sections `2` Limits, `4` Applications of Derivatives and `5` Integration (`content/final-exam.ts`). They have no problems yet. The candidate pool (77 numbers, without 542) is `FINAL_POOL` in the same file.

**Final Exam Dashboard:**
- Same layout as the regular Dashboard, with the exam card showing the date, "2:00 PM ET" and a live countdown.
- Completed, Chapters mastered (every active question's latest rating is Got it) and To review count Final Exam records only. The due banner appears only for real due items.
- With no questions, the study card says "Final Exam questions are on the way" and offers "Set your study times".
- Recent Activity shows Final Exam ratings only.
- Question Coverage takes the Study Plan Progress card's place. It shows attempted / not yet attempted (these add up to the pool) and, separately, awaiting review, checked again later and the latest self-reported ratings.

**Admin:**
- `/admin/settings` has a Final Exam card for name, date and start time.
- The class overview and Plan Builder stay Integration Review only.
- The problem editor accepts the chapters, and problem ids like `2-208` are accepted.

**Checks:**
- `tsc` passes, also with `--noUnusedLocals`.
- `npx vitest run`: 119 tests in 14 files. The 17 new ones are in `tests/prep.test.ts`, `tests/coverage.test.ts` and `tests/final-exam.test.ts`, which checks data separation both ways, separate schedules, sessions on the same day and settings.
- `next build` passes. Contrast and the content check pass.
- Upgrade test: the live code (`mth263-fix` worktree) built a database with students, ratings, reviews, ticks, notes and an open session. The new code then migrated it. No rows were lost, every old row is `exam4`, and a Final Exam session can start the same day.
- Browser check at 1440 px (dark) and 390 px (light), on a scratch database with 7 stand-in questions:
  - The return to `/plan?section=5.3&level=challenge` worked, and direct entry fell back to `/dashboard`.
  - A Final Exam session started, and rating kept it inside `/final-exam`.
  - `/practice/2-213` moved to `/final-exam/practice/2-213`.
  - The regular Dashboard and Review Queue stayed empty, and there was no horizontal scroll.
- Playwright: 33 tests in 8 files pass.
  - Includes the new `e2e/8-final-exam.spec.ts`, the Final Exam pages in the axe checks (both themes) and the 390 px checks, and the Final Exam start time in `e2e/2-admin.spec.ts`.
  - The suite ran in four groups because the computer was low on memory: 5–8, then 1–2, then 3, then 4 last.

**Before it goes live (ask first):**
- Back up first: a CSV export from `/admin` plus a Neon branch, because 0003 changes the live database.
- `vercel.json` turns off preview builds for `final-exam`. A preview would run against the live database without the migration.
- The open decisions are in `WEBSITE_IDEAS.md` (Final Exam 7–10).
- Next (your answer, 2026-11-10): import the 77 questions **with** hints, answers and worked solutions, like the Exam 4 problems. Show the four original OpenStax figures (212, 529, 530, 551) and the RAM table (459–461).

## Status at a glance

- **Live since 2026-11-09:** at your request ("push main"), stages 1–2 went to `main`, which deploys https://math-study-h4h3.vercel.app.
  - Classmates now get the schedule setup, Today's session and the quiet timer.
  - The Study Plan, Review and Progress pages stay the old ones until stage 6.
- **Branches:** work continues on `adaptive`, which Vercel never builds. Merging it into `main` publishes to the live site, so ask first.
- **Done:** the planner engine, **stage 1** (schedule setup and settings) and **stage 2** (study sessions and the quiet timer), with server code, screens and tests.
- **Now:** the **stage 3 ★ review** with you (questions at the end of this file). Stage 4 starts after that.
- **Upgrade-tested before going live:** the live site's old code built a database with student activity, then the new code upgraded it.
  - No rows were lost, and the 13 old "Got it" checks were closed as planned.
  - Every page's server code worked for the upgraded students.
  - The test caught one bug: the admin Plan Builder listed the empty 4.1/4.2 sections and could never be saved. Fixed and covered by a test.
- **Checks (all green):**
  - `npx tsc --noEmit` (also clean with `--noUnusedLocals`);
  - `npx vitest run`: 77 tests in 6 files;
  - `npx next build`, `npm run contrast`, `npm run content:check`.
- **Browser-checked** at 1440 px and 390 px, light and dark: sign-in, setup, dashboard card, session page (plan, in progress, done, Keep going), practice with Pause and the timer, Settings, and the form's error state.

## Dashboard fix and practice navigation (2026-11-09 evening): waiting for your check

**The bug** (`Downloads\MTH263_Dashboard_Navigation_Bug_Report.md`): on the live site and locally, Dashboard "opened Settings".
- Cause: since stage 2, any student without a saved schedule (`onboarded_at` null, which is every existing student after migration 0001) was sent to `/schedule?setup=1`.
- The sidebar marks `/schedule` as Settings.
- Separately, the dev server on 3263 had started before migration 0002, so its Dashboard crashed. It was restarted; backup in `.data\pglite-backup-2026-11-09`.

**Branch `fix/dashboard-opens`** (from `main`, pushed; worktree `C:\Users\thale\mth263-fix`; no migration). Only this branch is meant to go live, after your check.
- Sign-in, Dashboard and Today's Session no longer force schedule setup. Sessions use the default times (30 min, Mon–Fri) until a student saves their own. A quiet note on the Dashboard links to the schedule.
- The old Dashboard card ("Recommended next", Start/Continue Studying) is back. Its button starts or continues today's session. It's built from `src/components/session/StudyCard.tsx` and `src/lib/study-card.ts`.
- `TodayCard` is gone, and so are the setup view and the one-time "We've upgraded your study plan" note.
- The sidebar and tab bar mark a practice problem under where it was opened from (`src/lib/nav.ts`): session → Dashboard, `?item=` → Review Queue, else → Study Plan.
- Checks: `tsc`, 87 Vitest tests, `next build`, contrast, and 22 Playwright specs, including the new `e2e/6-nav.spec.ts` for the bug report's acceptance criteria. Vercel preview builds passed. Browser-checked at 1440 and 390 px, light and dark.

**On `adaptive`** (pushed; not live). The fix above is merged in, plus the practice-page navigation from `reference_nav.png` and `Downloads\MTH263_Practice_Exit_Return_to_Study_Section.md`:
- **X** next to the level badge: from a session it goes to `/session`. Otherwise it goes to the problem's own section and level, on its row (`exitHref` in `src/lib/checklist.ts`). The row scrolls into view and is briefly marked.
- **Previous / "Core 1 of 9" / Next** under the rating, only for problems opened from the Study Plan. They move without rating or ticking. Past either end they do what X does: you said yes to "Previous on the first problem goes back like X". If you meant greyed out, it's a one-line change in `practice/[problemId]/page.tsx`.
- Checks: 102 Vitest tests, contrast, content check, and 29 Playwright specs, including `e2e/7-practice-nav.spec.ts`.

**Servers left running** (each in its own minimized window): 3263 your dev server (`adaptive`), 3264 my test server (`adaptive`, scratch data), 3265 the fix branch (a copy of your local data).

**Next:** you check both. On your OK, merge `fix/dashboard-opens` into `main` and push. It has no migration, but ask first; it goes live. Then remove the worktree with `git worktree remove ..\mth263-fix`.

## Built on `adaptive` after the last push (2026-11-09; NOT live yet)

- **Immediate next problem:** rating Got it / Shaky / Lost saves, then opens the next problem. There is no feedback panel or Next button. A "Continue" link shows only if the next page takes over 6 seconds. (`src/components/practice/Workspace.tsx`.)
- **Study Plan redesign** (the spec in `Downloads\MTH263_Study_Plan_Prototype_Specification.md`):
  - Foundation / Core / Challenge selector, one section at a time, a checkbox per problem, saved per student. The address is `/plan?section=5.3&level=challenge`.
  - Rating a problem ticks it. Ticked-but-unrated problems rank last when sessions pick new work.
  - The sidebar has a Dark Mode switch, Settings below it, and Sign out at the bottom; the name card is gone.
  - `/plan/5.3` forwards to the new page. The dashboard bars and the practice page's "Challenge 2 of 5" use the same lists.
- **"Extra sections" option removed (2026-11-09):** the card on `/schedule` and the row on `/settings` are gone, and the schedule form no longer reads or writes `supplementaryOptIn`. `/plan` lists core sections only. Kept on purpose: the `students.supplementary_opt_in` column, the empty 4.1/4.2 shells and the engine's `includeSupplementary` (no migration). Once 4.1/4.2 get problems, students will have no way to opt in; that needs a new decision then. Checks: `tsc` clean, 87 Vitest tests, `next build` OK. Not browser-checked yet.
- **Migration `0002_checks.sql`:** new table `problem_checks`, plus a data step that ticks every problem already rated. Upgrade-tested on an old-schema database (3 rated ticked; skipped and unrated not; no rows lost).
- **Before pushing to `main`:** it changes the live database, so take a backup first (CSV export from `/admin` plus a Neon branch) and ask the user.
- **Checks:** `npx tsc --noEmit` clean, `npx vitest run` 86 tests, `npx next build` OK, `npm run contrast` OK. Browser-checked at 1440 and 390 px, light and dark. The Playwright specs (`e2e/`) were updated and added but **not run**.
- **Not done:** an engine unit test that ticked-unrated problems rank last (the rule is in `session-builder.ts` and `regressive.ts`); the stage 3 questions are still open.

## Resume

1. `cd C:\Users\thale\mth263-study`, then `git switch adaptive` (you should already be on it).
2. Dev server: `npx next dev -p 3263`. It migrates the local database (`.data/pglite`) when it starts.
   - To try it without touching that database, set `PGLITE_DIR` to an empty folder first (that's how the stage 1–2 browser checks ran).
   - `.env.local` has no `DATABASE_URL`, so local runs never reach the live Neon database.
3. Re-check the simulation with `npx tsx dev/simulate.ts --summary`. Drop `--summary` to see every session.
4. Continue at **"Next steps"** below.

## Your decisions (from the approved plan)

**Sign-in, units and plan size**
- Sign-in stays first and last name only, so privacy is only partly met (accepted).
- 4.10 opens with 2 Foundation warm-ups. Every later unit starts at Core. Foundation problems come back after a Shaky or Lost.
- Core problems per unit are sized to each student's time.

**Daily Challenge**
- Each study day opens with ONE Challenge problem on the previous study day's skills.
- It only follows a Core problem rated Got it without opening the worked solution.
- If the worked solution was used, the student gets another Core problem instead.
- If yesterday was Shaky or Lost, reinforcement takes its place.
- When the student is behind schedule, the Challenge becomes an optional bonus.

**Mastery ("demonstrated understanding")**
- A Core Got it, then a Challenge Got it on a later day, with no worked solution either time.
- A skill with no Challenge problem uses a second Core problem on a later day.

**Look-backs (Regressive Study)**
- After the first 2 problems in a new unit, one problem from the previous unit.
- Older units also come back at growing gaps (2, 4, 7, 12, 20 days), sooner if weak or if the current unit builds on them.
- At most 1 look-back a day, or 2 on days of 60 minutes or more. Each can be skipped.

**Defaults approved with the plan**
- Keep my 173 problems for now.
- 4.1 and 4.2 are opt-in supplementary shells.
- A quiet timer.
- The Got-it 14-day re-check is replaced by look-backs.
- The Plan Builder becomes a Rules page.
- Reminders are in-app only.
- Students can change their own exam date.
- A sign-in rate limit per network.
- Extra Challenges under "Keep going".

## Done so far

### Content
- `content/types.ts`:
  - `SectionId` now includes 4.1 and 4.2;
  - new `SectionKind` (core or supplementary);
  - concepts can list `prerequisites` (written `"section:skill"`).
- `content/sections.ts`:
  - every section has `kind`;
  - a **draft skill map** of prerequisites, taken from the textbook's order of ideas. **Please review it.**
  - two **Supplementary** sections with no problems:
    - 4.1 Related Rates;
    - 4.2 Linear Approximations and Differentials.
  - new export `CORE_SECTIONS`, re-exported from `content/index.ts`.
- `tests/content.test.ts`: the pool checks now cover Exam 4 sections only, and it checks that every prerequisite names a real skill.

### Database (all additive; nothing is dropped)
- `src/db/schema.ts`:
  - `students`: availability, own exam date, supplementary opt-in, `onboarded_at`.
  - `sections`: `kind`, plus `edited_by_admin` so a re-seed never overwrites admin edits.
  - `problems`: `est_minutes`, `source`, and hand-picked `similar_ids` / `easier_ids`.
  - `attempts`: `active_seconds` (the timer) and `session_item_id`. Attempt origins add challenge, lookback and extra.
  - New tables: `study_sessions`, `session_items`, `problem_time_stats`.
  - `settings.rules` holds admin rule overrides.
  - `admin_login_attempts.kind` lets the same table rate-limit student sign-ins.
- `drizzle/0001_adaptive.sql` was generated by drizzle-kit, plus two data steps:
  - close pending "Got it +14 days" review items (history stays);
  - mark problems without an OpenStax number as `original`.
- `src/db/seed.ts`:
  - upserts sections only when not admin-edited, and sets `kind`;
  - creates legacy plan counts only for Exam 4 sections;
  - sets each problem's `source`.
- `src/server/plan.ts` (legacy fixed plans) now only builds plans for sections that have plan counts, so the shells never get one.

### Planner engine: pure functions in `src/lib/`, shared by the server, the tests and the simulator

| File | What it does |
|---|---|
| `rules.ts` | Every tunable number with its default, and `resolveRules()` to merge admin overrides safely |
| `reasons.ts` | Reason codes and their plain-English sentences, the track labels, and title/skill lookups |
| `availability.ts` | Weekly pattern (days × sessions × minutes, 15–180 min, up to 3 sessions); validation, weekly total, planned slots, a description like "Mon–Fri · 1 × 30 min"; default 30 min Mon–Fri |
| `estimates.ts` | Default minutes F 5 / C 10 / Ch 15, blend toward class times (needs 5 students), the student's speed factor (median, pulled toward 1, clamped 0.5–2) |
| `learning-state.ts` | The six skill states, the mastery rule, unit roll-ups, and per-unit counts of new-learning work vs. all work. `supersededReviewIds()` finds reinforcement no longer needed because the skill is Demonstrated |
| `planner.ts` | Core-per-unit sizing (one stable total spread by skill count), the last 2 study days kept for review, pacing (ahead / on track / tight / behind, with a minutes-per-week suggestion when behind), and a forecast of units by day |
| `regressive.ts` | Look-back schedule (bridge check, spaced boxes, weak / building-block / demonstrated factors, skips) and choice of the look-back problem |
| `session-builder.ts` | Builds a session: yesterday's Challenge (or bonus), room kept for new work, a short look-back in short sessions, capped reinforcement, new learning by value per minute, look-back placement; "Keep going" options; `overflowToDrop()` |
| `engine.ts` | `computeModel()`, `planSession()` and `extraOptions()` tie everything together, and learn each student's real reinforcement load |
| `scheduler.ts` | Changed: Got it creates no item; Lost can't chain easier problems (`immediateEasier: false` waits a day); `followUpsToClose()`; messages updated |

### Refinements the simulation led to

These go slightly beyond the plan text.

- **Room for new work:** every session keeps room for at least one new problem (outside the final review days), so review can't block progress.
- **Short look-backs:** a look-back gets at most about 25% of a session. A 30-minute session gets a short one, often a Foundation problem, as in your spec's example.
- **One easier problem per Lost.** The next one waits until tomorrow.
- **Closing follow-ups:** once the original Shaky or Lost problem is solved cleanly, its similar or easier follow-ups close. The original's own re-check is never closed this way.
- **What counts toward a unit:** only new-learning work (plan, browse, Keep going). Reinforcement, look-backs and the Challenge don't.
- **Final review days:** never-studied skills come first (up to half a session), starting with units never opened. The rest goes to look-backs and reinforcement.
- **Realistic sizing:** each student's real reinforcement share (last 14 days) is used, so plans stay realistic for students who struggle.

### Tests and tools
- `tests/engine.test.ts` has 30 tests covering:
  - availability;
  - rules and estimates;
  - the six states and the mastery rule;
  - A/B/C sizing and pacing;
  - sessions: fit the time, warm-ups, Challenge/bonus, room for new work, missed days, final review, overflow;
  - look-backs: bridge, never-studied units excluded, weak sooner, boxes;
  - every reason sentence.
- `tests/scheduler.test.ts`: updated for the new Got it rule; adds the no-chain rule and follow-up closing.
- `dev/simulate.ts` replays students A, B and C from Nov 9 to Dec 1 through the real engine with made-up ratings.

### Stage 1: schedule setup and settings (done 2026-11-07)
- **Sign-in rate limit** per network, about 60 sign-ins per 10 minutes (`studentSignInRetryAt` / `recordStudentSignIn` in `src/server/admin.ts`). Admin lockout queries now count only admin rows.
- **`/schedule`** (`src/app/(student)/schedule/page.tsx`, `src/components/forms/ScheduleForm.tsx`):
  - day chips (real checkboxes), sessions a day, minutes each, "Different on some days" table;
  - a live weekly total and the number of sessions before the exam;
  - the student's own exam date ("Use the class date" to go back);
  - the 4.1/4.2 opt-in.
  - The first visit (`?setup=1`) shows a welcome, plus a one-time "We've upgraded your study plan" note for students with history.
  - Parsing is pure and tested (`src/lib/schedule.ts`); the action is `src/app/actions/schedule.ts`; `saveSchedule()` sets `onboarded_at` once.
- **Setup redirect:** after sign-in, and from the dashboard and `/session`, until a schedule is saved.
- **Settings** has a "Study schedule" card. Mixed schedules read like "Mon–Fri 1 × 30 min · Sat 1 × 60 min".
- The 4.1/4.2 shells are kept out of the old Plan/Dashboard/Progress lists and the landing page.

### Stage 2: study sessions and the quiet timer (done 2026-11-07)
- **`src/server/sessions.ts`:**
  - preview (never writes) and `startSession()` (double-click safe through the unique slot index);
  - pause/resume, finish (unfinished items move to next time), skip (look-backs only);
  - Keep going (only offered picks can be added);
  - the practice page's session bar.
- **`src/server/practice.ts`:**
  - `openAttempt` links session items (the track sets the attempt's origin) and resumes a paused session.
  - `rateAttempt` adds the last timer seconds, closes follow-ups after a clean Got it, and records class timing (first tries only).
  - It also closes reinforcement that's no longer needed. Inside a session it inserts the easier problem and the bridge look-back, and moves overflowing new problems to next time.
  - `problemHistory()` feeds "Your Earlier Tries".
- **Quiet timer** (`src/components/practice/useQuietTimer.ts`, `src/app/api/time/route.ts`):
  - counts only visible, unpaused, unrated time, and never shows a clock;
  - saves every 2 minutes, when the page is hidden or left, and with the rating;
  - the server caps each save at 3 minutes and each attempt at 4 hours.
- **Screens:**
  - `/session`: plan preview with Start and "Different amount of time today?"; in progress with Continue and "Finish for today"; done, with "Have more time today?" and Keep going.
  - The practice page shows the session bar, "Why this problem", the estimate, Pause/Resume, "Skip this look-back" and your earlier tries.
  - A dashboard "Today's session" card.
  - New styles use only existing tokens; the contrast checker covers the new pairs.
- **Fixes along the way:**
  - `supersededReviewIds()` could never fire: open reinforcement always hid the skill's "demonstrated" state. It now reads the evidence (`evidenceMet`).
  - The Lost message no longer promises "next up" when the easier problem waits a day.
  - Follow-ups never pick a problem already planned later in the same session.
- **Tests:** `tests/session-flow.test.ts` (6 tests on real Postgres): schedule, preview, start twice, the timer caps, easier after Lost, pause, next-day Challenge, bridge look-back, skip, finish, Keep going. `tests/flow.test.ts` is fixed, with a sign-in limit test added.

## Simulation results (latest run 2026-11-07, `npx tsx dev/simulate.ts --summary`)

| Student | Time | Start | End result |
|---|---|---|---|
| A | 30 min × 1 × Mon–Fri | Tight: the Challenge becomes a bonus | All 8 units with 2–4 Core each; 22 new, 27 reinforcement, 12 look-backs; 33 of 50 skills touched; 0 demonstrated (no Challenges, as designed); final days covered 5.7 first |
| B | 30 min × 2 × Mon–Fri | On track | All 8 units with 2–7 Core each; 16 daily Challenges, 25 look-backs; 48 of 50 skills touched; 9 demonstrated |
| C | 90 min × 1 × Mon–Sat | Ahead | Almost every Core problem; 16 Challenges, 30 look-backs; 22 demonstrated, 1 not started |

Bugs the simulation found and that are fixed:
- the current unit's target crept up every day;
- new work was starved by reinforcement;
- 12-minute look-backs in 30-minute sessions;
- reinforcement counted as unit progress;
- final review didn't reach unstudied units.

Since the reinforcement-closing fix (stage 2), B ends with 9 skills demonstrated (was 7) and C with 22 (was 25; the pretend ratings fall differently once items close).

## Next steps (in order)

### Stage 3 ★ (now: review with you)
Questions at the end of this file. The engine is unchanged except for the fixes above; any sizing change you choose is small (`src/lib/planner.ts`).

### Stage 4: targeted reinforcement in the UI
Track labels on the Review page. The rest of the logic already lives in the engine and the rating flow.

### Stage 5 ★: Regressive Study in the UI
Skip, reasons, the end-of-session prompt, final-review days, and the Review page's Regressive Study section.

### Stage 6 ★ = Release 1
- Rebuild the dashboard as the command center: today's plan, reinforcement, look-back card, progress by skill state, the week.
- Rebuild the Study Plan as a roadmap (skills, planned dates, the three tracks, Supplementary group), the section page (skill states, browse any problem), and the Review page (Targeted Reinforcement / Regressive Study × Overdue / Today / Upcoming).
- Remove the legacy assignment flows: `ensureAssignments` calls, `nextAfter`, and the per-problem "Mastered" label.
- Load the design skills first, then check every page at 1440 and 390, light and dark.

### Stage 7 ★ = Release 2
- Progress page: completion, confidence and demonstrated shown separately; F/C/Ch; help; time vs. estimate; look-backs; reinforcement outcomes.
- Admin:
  - per-student "how the plan adapts";
  - class weak skills;
  - Rules page (replaces the Plan Builder);
  - sections and skill-map editor;
  - problem time, source and links in the editor;
  - new CSV columns.

### Stage 8: testing
- Update the e2e specs, run axe in both themes, and check pages at 390 px.
- `npm run check`, `npm run contrast`, `npm run content:check`.

## Cautions before any push or deploy (ask first, always)

- **`main` is the live site.** Every push to `main` runs the migrations and the seed on the live Neon database, then deploys.
- **Previews never change the database.**
  - `adaptive` doesn't build on Vercel at all (`git.deploymentEnabled` in `vercel.json`).
  - Any other preview build skips the migrations and the seed (`skipOnPreview` in `scripts/env.ts`), because Neon is connected to all environments.
- **Test every new migration as an upgrade**, not only on an empty database. That's how 0001 was checked:
  1. Extract the live code with `git archive origin/main`.
  2. Fill a PGlite folder using that old code.
  3. Run the new code's migration, seed and server functions on that folder.
- **Back up before the next migration:** a CSV export from `/admin`, plus a Neon backup branch. This wasn't done for 0001, which only adds and was upgrade-tested first.
- **Release plan changed on 2026-11-09:** stages 1–2 went live early, at your request. Later stages go live as they're merged.
- **Enum values:** the migration adds enum values (`ALTER TYPE ... ADD VALUE`). They must not be *used* inside the same migration, because Drizzle runs all pending migrations in one transaction.
- **`pg` 9 later:** rating runs a few queries in parallel inside one transaction. `pg` 8 queues them, with a one-time deprecation warning. `pg` 9 would need them in sequence.

## Questions waiting for you (stage 3 review)

1. **Daily Challenge on short days.** On a 30-minute day the Challenge takes about half the session, which makes more time give *fewer* Core problems. Core problems per unit with the current rules, from Nov 9:

   | Schedule | Per week | Challenge | Core per unit (8 units) | Total |
   |---|---|---|---|---|
   | Mon–Fri 30 min (A) | 2 h 30 | bonus (tight) | 5 4 5 4 3 3 4 4 | 32 |
   | Mon–Fri 30 + Sat 60 | 3 h 30 | daily | 3 2 3 3 2 2 2 2 | 19 |
   | Mon–Fri 45 min | 3 h 45 | daily | 4 3 4 4 3 3 3 3 | 27 |
   | Mon–Fri 2 × 30 (B) | 5 h | daily | 7 5 6 6 5 5 5 5 | 44 |

   **Recommendation:** make the Challenge part of the plan only on days with at least 60 minutes. On shorter days it's an optional bonus at the end, as it already is when a student is behind. More time would then never mean fewer Core problems.
2. Review the **skill map** (the `prerequisites` in `content/sections.ts`). It decides which earlier units come back sooner as building blocks.
3. Review the **4.1 / 4.2 skill names** (also in `content/sections.ts`). They're placeholders until the problem-selection step.
4. **Mastery for students who are short on time:** with the Challenge as a bonus, a student like A ends with almost no skills marked Demonstrated (the simulation shows 0). Options: keep it (honest), or offer the bonus Challenge more visibly. This links to question 1.
