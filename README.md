# MTH 263 Calculus Study Platform

A study site for **MTH 263 Exam 4** (OpenStax Calculus Volume 1, sections 4.10 and 5.1–5.7). Students sign in with their name, get a personal study plan, practice one problem at a time (hint, answer, step-by-step solution), rate how confident they feel, and get spaced review. An `/admin` area (access code) shows class progress and manages problems, the plan, students and the exam date.

- Live site: https://math-study-h4h3.vercel.app
- Code: https://github.com/thalessocrates7-cell/Math_Study (branch `main`)
- Exam date (default): 2026-12-02. Admins change it in `/admin/settings`.

## Features

**Students**
- Sign in with first and last name only. The same name (any capitals or spacing) opens the same account; there is no password or email.
- Study plan of 15 problems per section (5 Foundation, 7 Core, 3 Challenge), different subsets per student.
- Practice workspace: Get a Hint (one at a time), Reveal Answer, Worked Solution (step by step), notes box.
- Confidence rating drives review: **Got it** returns in 14 days; **Shaky** returns tomorrow plus a similar problem; **Lost** serves an easier problem right away and the original returns tomorrow.
- Dashboard (exam countdown, next step), review queue, progress charts, light and dark themes, phone layout with bottom tabs.
- **Final Exam** (`/final-exam`): the same pages (Dashboard, Study Plan, Review Queue, My Progress, Today's Session, Settings) for the cumulative final, opened from the **Final Exam** item under Settings (on phones, the top bar). It has its own study schedule, sessions, reviews and progress; nothing mixes with the regular site. Inside it, **Integration Review** (the same spot in the sidebar) returns to the exact page the student left, or to `/dashboard` when the Final Exam was opened directly. Its units are the chapter review exercises: 2 Limits, 3 Derivatives, 4 Applications of Derivatives, 5 Integration. The 102 questions have hints, answers and worked solutions like the other problems. They are the import spec's 77 (Exercise 542 left out) plus all 25 of Chapter 3's review exercises, 367–391. It is an initial pool and may grow. The pool is in `content/final-exam.ts` and the questions in `content/problems/final-*.ts`. Six questions show their original OpenStax figure (`public/figures/final/`).

**Admin** (`/admin`)
- Class overview, student list and per-student history, rename / merge / delete students.
- Problem bank with an editor and live math preview.
- Study Plan Builder (Foundation / Core / Challenge counts per section).
- Exam name and date, the Final Exam's name, date and start time, CSV export, delete all student data after the course.
- Five wrong access codes from one network lock sign-in for 15 minutes.

## Tech

Next.js 16 (App Router), React 19, TypeScript, Drizzle ORM with Postgres (PGlite locally, Neon in production), KaTeX (server-rendered, with MathML), plain CSS tokens (light and dark), Vitest and Playwright. No password or analytics; only names and study progress are stored.

> `AGENTS.md` warns that this Next.js version has breaking changes. Check `node_modules/next/dist/docs/` before relying on older APIs.

## Run it locally

```bash
npm install
cp .env.example .env.local        # then fill in the two values below
npm run dev                       # http://localhost:3000
```

In `.env.local`:
- `SESSION_SECRET`: any random string of 32 or more characters.
- `ADMIN_CODE_HASH`: run `npm run admin:hash -- "your access code"` (10+ characters) and paste the output.
- Leave `DATABASE_URL` empty. The app then uses an embedded Postgres (PGlite) in `.data/pglite`, which creates its tables and loads the problems on first start. Delete `.data/` to reset.

Windows PowerShell: use `npm.cmd` instead of `npm` if scripts are disabled.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Develop, build, and serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest: scheduler, rules, content, and a full flow against in-memory Postgres |
| `npm run content:check` | SymPy checks every answer in the problem bank (needs the Python venv below) |
| `npm run contrast` | WCAG contrast for every color token pair, both themes |
| `npm run e2e` | Builds, then runs Playwright (student flow, admin, axe accessibility in both themes, 390px phone checks) |
| `npm run db:generate` | Generate a migration after editing `src/db/schema.ts` (commit the new `drizzle/*.sql`) |
| `npm run db:migrate` / `db:seed` | Apply migrations / load problems into `DATABASE_URL` (add `-- --force` to seed to refresh problems an admin has not edited) |
| `npm run admin:hash -- "code"` | Print an `ADMIN_CODE_HASH` value |
| `npm run check` | Typecheck, tests, and build |

**Answer checking setup (once):**
```bash
python -m venv dev/.venv
dev/.venv/Scripts/python -m pip install sympy lark     # Windows; use dev/.venv/bin/python on macOS/Linux
```

**Before running e2e:** nothing else may be listening on port 3270 (the test server). Playwright starts its own server with a throwaway database and a test-only admin code, so it never touches your local data.

## Project layout

```
content/      Problem bank (source of truth): sections, concept tags, 173 problems in problems/*.ts; final-exam.ts (Final Exam chapters, date, pool) and its 102 questions in problems/final-*.ts
public/       Static files: figures/final/ (the original figures some Final Exam questions need)
src/app/      Routes: landing, sign-in, (student)/… (and (student)/final-exam/…), admin/…, Server Actions in actions/
src/components/views/  The student pages, shared by both environments (each route passes prep="exam4" or "final")
src/components/  UI: shell and nav, practice Workspace, charts, forms, admin editors
src/lib/      Pure logic: scheduler, mastery, NY-time dates, names, KaTeX rendering, sessions
src/server/   Database queries: plan, practice, progress, students, admin, settings
src/db/       Drizzle schema, driver switch (PGlite or Postgres), idempotent seed
src/styles/   tokens.css (all colors, light-dark()) and app.css
drizzle/      SQL migrations
tests/  e2e/  dev/  scripts/   Unit tests, browser tests, content/contrast checks, admin and DB scripts
```
More detail: `PROJECT_CONTEXT.md` (architecture, rules, design conventions) and `WORK_SUMMARY.md` (status and open items).

## Content and answers

Each problem has a statement (TeX with `$…$` and `$$…$$`), hints, a final answer, and 2–5 worked steps. Every answer carries a machine check (`check` field) verified by `npm run content:check`; a few conceptual proofs are marked `manual`. After adding or editing problems, run `npm run content:check` and `npm test`. Problems are chosen from OpenStax exercise numbers; original practice problems use ids like `5.4-o1`.

## Deploy (Vercel + Neon)

1. Import the repo in Vercel. `vercel.json` makes every build run `npm run vercel-build` (migrate, seed, then `next build`).
2. In the Vercel project, connect a Neon database (Storage tab, all environments) so `DATABASE_URL` is set. Without it the build stops with a clear message.
3. Add environment variables `SESSION_SECRET` (random, 32+ characters) and `ADMIN_CODE_HASH` (from `npm run admin:hash`). Use a different admin code than the local and test ones.
4. Redeploy, then sign in with a test name, do one problem, open `/admin`, and delete the test student.

To change the admin code later: generate a new hash, update `ADMIN_CODE_HASH` in Vercel, and redeploy.

## Privacy and license

The site stores only names and study progress (opened problems, help used, ratings, notes). Admins can export a CSV and delete all student data.

Problems are adapted from *Calculus Volume 1* by Gilbert Strang and Edwin “Jed” Herman (OpenStax), licensed **CC BY-NC-SA 4.0**. Hints and worked solutions are original to this site and shared under the same license. Attribution appears in the footer and on every problem page.
