# PROJECT_CONTEXT.md — MTH 263 Calculus Study Platform

Handoff document for a fresh Claude Code session. Written 2026-11-05 (America/New_York). Read this first, then `AGENTS.md` (Next.js 16 has breaking changes; docs are in `node_modules/next/dist/docs/`).

## 1. What this is

A website for **MTH 263 (Calculus) Exam 4** prep at NVCC, built by the user (a student) for themself and classmates. **Exam 4 is 2026-12-02** (27 days from 2026-11-05).

Spec sources (in `C:\Users\thale\Downloads\`):
- `MTH 263 Calculus Study Platform – Design Document.docx` (the spec; `(1)` copy is identical)
- `MTH 263 Calculus Platform UI Specification.png` and `MTH 263 Calculus Study Platform UI Board.png` (visual targets)
- The approved plan: `C:\Users\thale\.claude\plans\c-users-thale-donloads-mth-263-calculus-federated-moth.md`

Core product: students sign in with **first + last name only** (no password/email), get a study plan by section, practice **one OpenStax problem at a time** (Get a Hint / Reveal Answer / Worked Solution, step by step), rate confidence (**Got it / Shaky / Lost**), and the system schedules spaced review. An `/admin` area (access code) shows class progress and manages problems, plan counts, students, exam date, CSV export.

### Decisions the user made (do not re-litigate)
- **Hosted web app** (Next.js + Postgres), NOT a claude.ai Artifact.
- **Sections:** 4.10, 5.1–5.7 (OpenStax Calculus Vol. 1). Not 4.2.
- **Content:** Claude wrote the problems from OpenStax exercise sets (kept the book's exercise numbers), with own hints/steps; SymPy verifies answers.
- **Exam date default** 2026-12-02 (from the mockups); admin can change it in `/admin/settings`.
- Build workflow preferences (from memory): load the design skills before UI work; keep flows low-friction (few steps, one primary action per screen).

## 2. Stack and versions (pinned exactly in package.json)

Next.js 16.4.5 (App Router, Turbopack), React 19.3.1, TypeScript 6.0.3, Drizzle ORM 0.45.4 + drizzle-kit 0.31.11, `pg` 8.23.1 (production), `@electric-sql/pglite` 0.5.15 (local/test Postgres), `jose` 6.2.15 (signed cookies), KaTeX 0.19.1 (server-side, MathML output), lucide-react 1.69.0, Vitest 5.1.0, Playwright 1.65.0 (+ `@axe-core/playwright`), tsx. Node 26.7 locally (engines `>=22`). Python 3.14 venv at `dev/.venv` (SymPy 1.14, lark). Fonts: Inter via `next/font/google`. No Tailwind (plain CSS tokens; the plan mentioned Tailwind but it was not used).

Notes:
- npm 11 skipped esbuild install scripts; tsx/Next/Vitest still work.
- lucide-react 1.x renamed icons: use `House` (not Home), `ChartColumn`, `CircleCheck`, `CircleX`, `TriangleExclamationPoint`, `CircleExclamationPoint`, `Trash`, `WavesHorizontal`, `Map`, etc. Check `node_modules/lucide-react/dist/lucide-react.d.ts` before using a name.
- `next dev` auto-generates/re-adds `AGENTS.md`; keep it.

## 3. Project location, git, and env

- Project root: `C:\Users\thale\mth263-study\`. It lives inside the user's home directory, which is itself a git repo (branch `master`, no commits, everything untracked). **Never `git add -A`/`.` from there; stage explicit paths only.** No commits/pushes/deploys have been made. Ask before any push or deploy.
- Root `C:\Users\thale\CLAUDE.md` documents the home repo; it does not yet mention this project (TODO: add one line).
- `.env.local` (git-ignored) has `SESSION_SECRET` and `ADMIN_CODE_HASH` for local dev. The **plaintext local admin code** is in `C:\Users\thale\AppData\Local\Temp\claude\5dc79f1aa647813e\6e875724-0696-49c7-8960-f9202522e038\scratchpad\local-admin-code.txt` (temp dir; may vanish). To reset: `npm run admin:hash -- "new code"` and paste the output into `.env.local`.
- Env vars: `SESSION_SECRET` (≥32 chars; required on Vercel), `ADMIN_CODE_HASH` (format `scrypt:N:r:p:salt:hash`, colon-separated on purpose so `$` never gets expanded in .env), `DATABASE_URL` (empty locally → PGlite at `.data/pglite`; `DATABASE_URL_UNPOOLED` preferred by migrate/seed scripts), `PGLITE_DIR` (`memory` for in-memory), `REQUIRE_SESSION_SECRET`.
- E2E uses a test-only admin code `e2e-admin-code-2026` (hash is in `playwright.config.ts`); throwaway DB `.data/e2e`, port 3270.

## 4. Commands

```
npm run dev            # next dev (I ran it on port 3263: npx next dev -p 3263)
npm run build / start
npm run typecheck      # tsc --noEmit   (currently clean)
npm test               # vitest: 36 tests across 4 files (currently all pass)
npm run content:check  # exports dev/checks.json then SymPy-verifies every answer (200 checks pass, 6 manual)
npm run contrast       # node dev/contrast.mjs: WCAG contrast for every token pair, both themes (all pass)
npm run e2e            # next build && playwright test  (see Known issues)
npm run db:generate    # drizzle-kit generate (after editing src/db/schema.ts)
npm run db:migrate / db:seed   # against DATABASE_URL (Neon); locally PGlite self-migrates+seeds
npm run admin:hash -- "code"
npm run vercel-build   # migrate + seed + next build (used on Vercel)
```
Windows/Git Bash notes: stop stray servers by PID with PowerShell `Stop-Process`; `TaskStop` of a background task does NOT kill the child node process.

## 5. Architecture

### Folder map
```
content/                 Problem bank (TypeScript, source of truth)
  types.ts               ProblemSeed, Check (SymPy check kinds), PlotSpec, Difficulty ("F"|"C"|"Ch")
  sections.ts            8 sections: title, objectives (from OpenStax), concept tags, url
  helpers.ts             `t` = String.raw tag; sectionProblems(); sample() for plot curves
  problems/{4-10,5-1..5-7}.ts   173 problems total (see §7)
  index.ts               ALL_PROBLEMS, DEFAULT_PLAN (5/7/3), SMALL_PLAN (3/5/2), DEFAULT_EXAM, ATTRIBUTION
src/db/                  schema.ts (Drizzle), client.ts (driver switch, getDb(), createPgliteDb), seed.ts (idempotent)
src/lib/                 Pure logic: scheduler.ts, mastery.ts, dates.ts (NY time), names.ts, random.ts,
                         tex.ts (KaTeX render), session.ts (jose cookies), auth.ts, admin-code.ts (scrypt)
src/server/              DB-touching modules: plan.ts, practice.ts, progress.ts, students.ts, settings.ts, admin.ts
src/app/                 Routes: / , /signin, (student)/{dashboard,plan,plan/[section],practice/[problemId],review,progress,settings},
                         admin/ (code form), admin/(panel)/{dashboard,students,students/[id],problems,problems/[id],plan,settings},
                         admin/export (CSV route), actions/{auth,practice,admin}.ts (Server Actions), error/not-found/icon
src/components/          Shell/nav, Badges, Progress, charts (hand-built SVG), FunctionPlot, forms/, practice/Workspace+NotesBox, admin/
src/styles/              tokens.css (all colors as light-dark()), app.css (all component CSS)
scripts/                 migrate.ts, seed.ts, admin-hash.ts, env.ts
drizzle/                 0000_init.sql (generated; commit with schema changes)
tests/                   Vitest: scheduler, lib, content, flow (real PGlite in-memory end-to-end domain flow)
e2e/ + playwright.config.ts   Playwright specs (student, admin, a11y/axe, rate-limit) + serve.mjs
dev/                     verify_content.py (SymPy), export-checks.ts, check-content.mjs, contrast.mjs, .venv/
```
Path aliases: `@/*` → `src/*`, `@content/*` → `content/*` (tsconfig + vitest).

### Data model (src/db/schema.ts)
students (name_key unique = normalized "first|last"), sections, problems (jsonb hints/steps/concepts/figure/check; `edited_by_admin` protects admin edits from re-seed; `active`), plan_config (per-section F/C/Ch counts), assignments (student's fixed plan, `position`), attempts (hint_used, hints_shown, answer_revealed, solution_viewed, rating, rated_day NY, next_review_date; partial unique index: one open attempt per student+problem), review_items (due_date, reason got_it|shaky|lost|similar|easier, status; partial unique: one pending per student+problem), notes, settings (singleton id=1: exam name/date), admin_login_attempts (rate limit).

### Key behaviors / rules
- **Auth:** student = signed httpOnly cookie `mth_student` (180 days) set on name sign-in (same normalized name ⇒ same account; anyone typing your name gets your progress — accepted low-stakes, stated on the sign-in page). Admin = cookie `mth_admin` (12 h) after verifying `ADMIN_CODE_HASH`; **5 wrong codes per IP-hash per 15 min lock sign-in** (even the right code). Theme cookie `mth_theme` + `data-theme` set server-side on `<html>` (no flash); also saved on the student row.
- **Study plan:** 15 problems/section (5 Foundation, 7 Core, 3 Challenge); `computeAssignment` keeps already-rated problems, fills gaps via seeded per-student shuffle, orders F→C→Ch then OpenStax number. Pools have spares (≥ 6F/9C/4Ch each) for similar/easier follow-ups. Admin Plan Builder can rebalance existing students (never drops worked problems).
- **Scheduler (src/lib/scheduler.ts, unit-tested):** Got it → same problem back in **+14 days** (the doc said both +2 weeks and +7 days; chose 14). Shaky → original +1 day **and** a *similar* problem (same section+difficulty, shared concept, unseen) +1 day. Lost → an *easier* problem (Foundation on same concept preferred) served **immediately** (Continue goes to it with `?item=<review_item_id>`), original +1 day. "Today" = America/New_York calendar day.
- **Mastery:** problem mastered = latest rating Got it AND Got it on ≥2 different days; section mastered = every assigned problem's latest is Got it.
- **Practice flow (Workspace.tsx):** opening creates/reuses an open attempt (server action); hint/answer/solution reveals are logged immediately; rating is idempotent; after rating, a confirmation appears and focus moves to the Continue link. Worked solution is a native `<dialog>` with step chips, Previous/Next, "Show full solution".
- **Math:** content strings use `$…$` inline, `$$…$$` display, `\$` literal dollar, lines starting `|` = table. Rendered **server-side** by KaTeX (`output: htmlAndMathml`, `trust:false`, text HTML-escaped). In content files use the `t` String.raw tag; never put `${` inside a `t` template.
- **Figures:** `PlotSpec` with precomputed points (no runtime expression eval), rendered by `FunctionPlot` SVG with required `alt`.
- **Problem ids:** `"<section>-<openstax number>"` (e.g. `5.2-72`) or originals `"5.4-o1"`. Original problems (marked in the UI as "original practice problem") exist in 5.4 (o1,o2,o3) and 5.7 (o1).
- **Re-seed:** `seedDatabase` inserts missing problems only; `--force` refreshes problems not edited by an admin.

## 6. Design system (must stay consistent)

From the design doc + mockups: minimal, professional, SaaS-like; **Inter**; 8px grid; 10–12px radius; cards; sidebar on desktop (≥900px), **bottom tab bar + top bar on mobile**; one problem per screen; light + dark themes (user toggle, persisted).
- Tokens live in `src/styles/tokens.css` as `light-dark(light, dark)` custom properties. Light bg `#F7F8FA`, text navy `#18243A`, accent indigo `#6558D3`; dark bg `#111827`, cards `#1F2937`, button accent `#7C3AED`. The doc's dark accent as *text* fails contrast, so text uses `--accent-text` (`#B9AEFF` dark). Progress fills/indicators use `--chart-accent` (≥3:1 both themes). **Any new token pair must be added to `dev/contrast.mjs` and pass.**
- Status colors (success/warning/danger) and difficulty colors are never color-only: always icon + word; difficulty always shows letter **F / C / Ch** plus name.
- Rating chart colors (`--chart-got/shaky/lost`) were chosen with the dataviz validator (CVD ΔE ≥ 8 light/dark); charts always have a legend, text summary, and a "Show as a table" view. Don't switch to red/green-only palettes.
- A11y requirements (WCAG 2.2 AA): visible focus ring, ≥44px touch targets, skip links, labeled controls, `role=alert` on form errors, `aria-live` for hint/answer announcements, dialogs return focus to trigger, reduced-motion respected, forced-colors fallbacks, overflowing math/tables become keyboard-scrollable (`OverflowFocus`).
- Polish rules applied: no `transition: all`, tabular numerals for counts, `text-wrap: balance/pretty`, concentric radii.
- Layout CSS gotcha: KaTeX's hidden MathML copy is `position:absolute`; `.katex`/scroll containers are `position:relative` so it can't widen the page.
- `.shell` paints the sidebar column with a gradient so the sidebar background reaches the bottom on long pages.

## 7. Status — what is DONE

- **Content:** 173 problems: 4.10 22 (7F/10C/5Ch), 5.1 21 (8/9/4), 5.2 22 (8/10/4), 5.3 23 (8/10/5), 5.4 20 (6/10/4), 5.5 21 (6/10/5), 5.6 22 (7/10/5), 5.7 22 (6/11/5); every section has ≥6F/9C/4Ch (the default plan needs 5/7/3). All have ≥1 hint, answer, ≥2 steps. 200 machine checks pass in SymPy; 6 conceptual problems have `manual` checks (solved by hand). `tests/content.test.ts` also validates unique ids, known/used concept tags, TeX compiles with `throwOnError`.
- **Backend:** schema + migration, driver switch, idempotent seed, scheduler, mastery, plan assignment, practice/rating service, progress/report queries, admin queries (overview, roster, detail, problem CRUD/retire/delete, plan builder, CSV with formula-injection guard, login rate limit), merge/rename/delete students, purge-all.
- **UI:** landing, sign-in, student dashboard/plan/section/practice/review/progress/settings, admin sign-in/overview/students/student detail/problem bank/problem editor (live KaTeX preview)/plan builder/settings, loading/error/404.
- **Tests passing:** `tsc` clean; Vitest 36/36; SymPy 200/200; contrast all pass; `next build` succeeds (20 routes).
- **Manually verified in Chrome DevTools (dev server):** landing (dark), sign-in validation + sign-in, dashboard (light/dark), study plan, section page, practice page with plot, hint expand + announcements, worked-solution dialog (Escape closes and restores focus), rating Lost → confirmation → easier problem (5.2-80) served → Review badge count.

## 8. Status — UNFINISHED / next steps (in order)

### Update 2026-11-05, late session (supersedes stale parts below)
- Verified: e2e run 2 (`test-results/e2e-run2.txt`) = **19/19 pass**, so item 1 below is done. `tsc` clean, Vitest 36/36. The project now has **its own git repo** (`main`, commit `94f954f`, in sync with `origin` = github.com/thalessocrates7-cell/Math_Study). Still ask before any push.
- **New local admin code** is in `.env.local`, as a comment above `ADMIN_CODE_HASH` (dev only). The old scratchpad code no longer works. Sign-in with the new code was tested on 2026-11-06 and works.
- User decisions: keep the dev server (3263) running. The visual review must use the UI/UX skills (the Tier 1 roster in `~/.claude/skills/chm-111-trainer/SKILL.md`, minus `artifact-design`) and add **smooth transitions**. The user wants a **step-by-step Vercel + Neon walkthrough**; check current Vercel/Neon steps on the web before writing it.
### Update 2026-11-06: visual pass and smooth transitions BUILT (not committed)
Phone-width fixes (from the 390px screenshots):
- Admin Plan Builder stacks each section on phones (`.plan-table`; phone-only `.plan-level` labels; input width moved from an inline style to `.plan-count`).
- Section page: Start / Practice again buttons stay at the row's right edge (`.problem-meta > .btn { margin-left: auto }`).
- Top-bar avatar link: no underline, hover ring instead.
- Stat cards are 2×2 on phones (`.stat-grid` on /progress, /admin/dashboard, /admin/students/[id]).
- Sideways-scrolling tables get edge scroll shadows (`.table-wrap`/`.table-scroll`, token `--scroll-shadow`; `--scroll-bg` must match the card behind; set to surface-2 inside `.assist-panel`).
- Charts: empty rating rows show a grey track (`.stacked:empty`); the empty 14-day activity chart shows a message (`.cols-empty`).
- Dropped finding: "integral...." is the CSS line-clamp ellipsis after a sentence's period. Standard behavior, left alone.

Motion (CSS plus React `<ViewTransition>`, no new dependencies; tokens `--dur-fast/normal/slow` and `--ease-enter/exit` in tokens.css):
- `src/components/PageTransition.tsx` wraps all 17 page.tsx files: the new page fades and rises in, the old one fades out. The practice "Continue" link uses `transitionTypes={["nav-forward"]}` (slide). The section-page difficulty filter uses `["same-page"]` (no animation). `default="none"` keeps server-action refreshes still.
- Top bar, tab bar and landing header have `view-transition-name`s and z-index 100, so content never animates over them. The active-nav marker is now a real element (`.nav-indicator` in the sidebar, which is new, and `.tab-indicator`, which replaces `::before`) and glides between items.
- The theme toggle and the Settings theme radios cross-fade (`crossFade()` in `src/lib/motion.ts`). It's skipped under reduced motion.
- Dialogs (`.sheet`: worked solution and confirmations) fade and scale in with `@starting-style`. They fade out only where `overlay` is supported; elsewhere they close instantly.
- Hint and answer panels unfold (clip-path). Extra hints and newly chosen solution steps ease in vertically (a sideways slide would add a horizontal scrollbar in the dialog). Rating buttons and step chips transition. The (student) loading skeleton breathes and fades out.
- Reduced motion: the existing `*` rule doesn't reach `::view-transition-*`, so there are explicit rules (short cross-fade, no movement). Forced colors paint the nav markers Highlight.
- `dev/contrast.mjs` gained the pair chart-accent on accent-soft (4.08:1, passes).

Verified 2026-11-06 (dev server restarted on 3263 at the user's request; earlier the PC ran out of memory and Next's dev workers crashed): `tsc` clean, Vitest 36/36, contrast all pass, **Playwright 19/19** (`test-results/e2e-run3.txt`; production build OK). Live checks at 390 and 1440, light and dark:
- 2×2 stats, grey tracks and the un-underlined avatar.
- Section page: all 15 Start buttons flush right. The filter is a same-document navigation with no view transition.
- Hint panel runs `unfold`. The dialog opens and closes with transitions and returns focus to the trigger. A new step runs `rise`.
- Continue runs the `nav-forward` fade-and-slide, and it finishes.
- The theme toggle cross-fade finishes.
- Progress → Plan page transition, with the tab-indicator morph.
- Admin sign-in with the new local code works.
- Plan builder stacks on phones: 24 inputs on screen, no sideways scroll.
Not checked: reduced-motion rendering; Safari and Firefox (the dialog exit fade needs `overlay`, so they close instantly by design); the activity-chart empty message (a simple conditional).

Deploy prep (2026-11-06):
- Vercel's Next.js preset runs `npm run build`, not `vercel-build` (docs: vercel.com/docs/builds/configure-a-build). So `vercel.json` sets `"buildCommand": "npm run vercel-build"` (migrate + seed + build).
- On Vercel without a database, migrate and seed now fail the build with "connect the Neon database, then Redeploy" (`failIfVercelWithoutDatabase` in scripts/env.ts). `createDb()` throws instead of falling back to PGlite, because Vercel's disk is read-only.
- Neon from the Vercel Marketplace sets `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct; used by migrate and seed). Free plan per Neon's FAQ: 1 GB storage, 100 CU-hours/month, 5 GB transfer, no card.
- Walkthrough so far: step 1 is given (Vercel account via GitHub, plus choosing and hashing the production admin code). Remaining: commit and push (needs the user's OK), import the repo, add `SESSION_SECRET` and `ADMIN_CODE_HASH`, then deploy (the first build stops at the database check, as expected). Then Storage → Neon (US East) → connect to all environments → Redeploy → smoke test.
Known pre-existing dev-only warning: a hydration attribute mismatch on `.table-wrap`. `OverflowFocus` adds tabindex/role before the page segment hydrates; inside a closed `<details>` Chrome still measures the table as overflowing. It's harmless in production (React doesn't patch attributes) but shows as "1 Issue" in the dev overlay.
Still to do: finish the Vercel + Neon walkthrough (above); the README and a project CLAUDE.md; the one-line entry in `C:\Users\thale\CLAUDE.md`; cleanup (§8.5). Commit and push need the user's OK.

1. **Re-run the Playwright suite** (`npx next build && npx playwright test`). Last full run (before fixes): 5 passed, 10 failed, 4 not run. I then applied fixes (below) but the **rebuild + re-run was interrupted by the user, so none of the fixes are verified yet.**
   Fixes already applied in code, awaiting verification:
   - `Brand.tsx`: removed `aria-label` (axe `label-content-name-mismatch`); visible text is now the accessible name.
   - Notes box: now `<h2 id="notes-title">Notes</h2>` + `aria-labelledby` (was duplicate "Notes" label matching a region too).
   - `app.css`: `.katex`, `.table-wrap`, `.table-scroll`, `.math-display` → `position: relative` (was causing 352px horizontal overflow at 390px on `/admin/problems`).
   - e2e helpers: `adminTry` (no wait), `adminSignIn` (waits for `/admin/dashboard`), `appAlert(page)` = `.alert[role='alert']` (Next's empty route announcer also has role=alert → strict-mode violations).
   - `PlanBuilder` form `noValidate` so the server-side "only N available" error shows instead of the browser's.
   - Nav badge uses `<span class="sr-only"> due</span>` instead of `aria-label` on a span.
   - Spec fix needed/maybe pending: `2-admin` test `getByText(/^\d+ problems?$/)` failed (the count line renders as "173 problems" inside a `<p>` with `aria-live`; the text may be split/trimmed — verify the locator, e.g. `page.locator('p[aria-live]')`). Also test 1-student "notes" used `getByLabel("Notes")` (should be fixed by the heading change).
   Expect more axe findings on first full pass (contrast in dark, etc.); fix real issues, not tests.
2. **Review the 390px screenshots** the a11y spec writes to `test-results/shots-e2e/` (landing, sign-in, admin, all student/admin pages) and fix layout problems (not yet visually reviewed on phone; only desktop 1440 was reviewed).
3. **Visually review** pages not yet looked at: review queue, progress charts (donut/bars/activity), settings, admin pages, problem editor, dark-mode practice/solution dialog, mobile bottom tabs.
4. **Docs:** write `README.md` (setup, env vars, commands, deploy steps) and a project `CLAUDE.md` (or point it at this file); add a one-line entry for this project to `C:\Users\thale\CLAUDE.md`.
5. **Cleanup before handoff to user:** reset local demo data (delete `.data/pglite`; demo students "Demo Student" and "QA Tester" with a Lost rating exist there), remove `test-results/`, `dev/checks.json` (git-ignored anyway), stop stray servers (see §9).
6. **Deploy (needs the user):** create free Vercel + Neon accounts; set `DATABASE_URL`, `SESSION_SECRET` (random ≥32), `ADMIN_CODE_HASH` (from `npm run admin:hash -- "<code the user chooses>"`) on Vercel; `vercel-build` runs migrate + seed + build; smoke-test the same flow on the live URL. **Ask before any deploy/push.** Do NOT use the e2e test code in production.
7. Possible improvements if time (not required): author a few more original problems; per-figure editing in the admin editor (figures are content-file only today); rate limit on student sign-in; export of notes.

## 9. Known issues / gotchas / things that didn't work

- **Two node servers may still be listening:** dev server on **3263** (PID 37892 at last check) and a leftover e2e server on **3270** (PID 38124) from the interrupted Playwright run. Playwright's config uses `reuseExistingServer: false`, so a stale 3270 server will make the next `playwright test` fail to start — **stop PID on 3270 first** (`netstat -ano | findstr :3270` then PowerShell `Stop-Process -Id <pid>`).
- `TaskStop` on a background `next start` left the node child running (port stayed busy). Kill by PID.
- Dev-server hot reload logged a React warning ("final argument passed to useEffect changed size") after editing `ThemeToggle`; harmless HMR artifact. `ThemeToggle` now follows live OS color-scheme changes while no explicit theme is pinned.
- The dev "Next.js Dev Tools" overlay button overlaps the sidebar's Sign-out area in screenshots; dev only.
- During manual testing the isolated Chrome tab occasionally navigated itself (e.g. to /settings, /dashboard) — caused by tool/click side effects, not an app bug; the server log shows the requests.
- Don't use `aria-label` on elements whose visible text differs (axe `label-content-name-mismatch`); don't put `role="alert"` selectors in tests without scoping (Next injects one).
- Dates: always use `src/lib/dates.ts` (NY calendar day). Using `toISOString().slice(0,10)` shows the wrong day in the evening (fixed once in the review page).
- Parsing/figures: Riemann-sum rectangles are supported in `PlotSpec.rects` but unused so far; figures exist for 5.1-20, 5.1-43, 5.2-72, 5.2-84, 5.3-160.
- SymPy check pitfalls: use `.doit()` before `limit` on `Sum`; `integrate` of `Abs` gives exact values, fall back to 30-digit numeric otherwise; the validator samples many points incl. |x|<1 and |x|>3 for narrow domains.
- OpenStax source text was scraped to the scratchpad (`openstax-raw/`, `openstax-text/`, `scripts/parse_openstax.py` under the session scratchpad); not in the repo and may be deleted. The site only needs `content/`.
- Licensing: OpenStax Calculus Vol. 1 is **CC BY-NC-SA 4.0** (the design doc wrongly mixes CC BY / BY-SA). Attribution is in the landing footer (`ATTRIBUTION` in `content/index.ts`) and on every practice page. Keep it.

## 10. Conventions for future changes

- Don't rewrite working features; extend. Keep server/pure-logic split: rules in `src/lib` (unit-testable), DB in `src/server`, mutations via Server Actions in `src/app/actions` (always `requireStudent()`/`requireAdmin()` first; validate ids with regexes).
- New/changed problem → run `npm run content:check` and `npm test`; give it concept tags from `content/sections.ts` (the test requires every tag to be used and every problem to have ≥1). Hints should be Socratic, steps 2–5, answers checkable.
- Schema change → edit `schema.ts`, `npm run db:generate`, commit the new `drizzle/*.sql`; PGlite and Neon both apply the same migrations.
- New colors → tokens.css + `dev/contrast.mjs`. New charts → follow the dataviz rules (legend + text summary + table view).
- Verify UI changes in a real browser at 1440 and 390 widths, light and dark, before calling them done.
