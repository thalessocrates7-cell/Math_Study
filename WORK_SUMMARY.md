# MTH 263 Study Platform: work summary and wish list

Last updated 2026-11-06. Exam 4 is on **2026-12-02**.

## 1. The website today

**Live site:** https://math-study-h4h3.vercel.app (hosted on Vercel, database on Neon, code on GitHub: `thalessocrates7-cell/Math_Study`, branch `main`).

What students can do:
- Sign in with first and last name only (no password or email). The same name returns the same account.
- Get a personal study plan: 15 problems per section (5 Foundation, 7 Core, 3 Challenge) across sections 4.10 and 5.1 to 5.7 of OpenStax Calculus Vol. 1.
- Practice one problem at a time: Get a Hint, Reveal Answer, step-by-step Worked Solution, a notes box.
- Rate each problem Got it, Shaky or Lost. Spaced review follows:
  - Got it: comes back in 14 days.
  - Shaky: comes back tomorrow, plus a similar problem.
  - Lost: an easier problem is served right away, and the original returns tomorrow.
- See progress: dashboard with days to the exam, review queue, charts, weakest sections.
- Light and dark themes, phone layout with bottom tabs, desktop layout with sidebar.

What the admin can do (`/admin`, protected by an access code):
- Class overview, student list and each student's history.
- Problem bank with an editor (live math preview).
- Study Plan Builder (how many Foundation, Core and Challenge problems per section).
- Exam name and date, CSV export, delete all student data after the course.

Content: 173 problems written from OpenStax exercise sets; 200 answers machine-verified with SymPy.

## 2. What we did

**Earlier sessions (see `PROJECT_CONTEXT.md` for the full handoff):** built the whole platform, content, scheduler, admin area, and tests.

**This session (2026-11-05 and 06):**
- Reviewed the handoff, confirmed the browser tests pass (19/19), and found that the project had its own GitHub repo.
- Reviewed all phone screenshots and fixed what we found:
  - Admin plan builder now stacks on phones (the inputs were off-screen).
  - Start buttons line up on every row of the section page.
  - Header avatar no longer underlined.
  - Stat cards sit 2 by 2 on phones.
  - Wide tables get an edge shadow showing they scroll sideways.
  - Empty charts show a grey bar or a short message.
- Added smooth transitions (CSS plus React `ViewTransition`, no new libraries):
  - Pages fade and rise in; the top and bottom bars stay still.
  - The active tab marker glides to the new tab.
  - "Next problem" slides forward.
  - Light/dark switch cross-fades.
  - The worked-solution popup fades in and out; hints and answers unfold; solution steps ease in.
  - Everything respects the "reduce motion" setting.
- Made a new local admin code (stored in `.env.local`, never committed).
- Deploy preparation: `vercel.json` (runs database setup before every build), and a clear build error if no database is connected.
- Deployed: pushed to GitHub, imported into Vercel, connected a Neon database, redeployed. The live site returns HTTP 200 on the home, sign-in and admin pages.
- Tests at the end: typecheck clean, 36 unit tests, color-contrast checks, 19/19 browser tests (including accessibility scans in light and dark and phone-width checks).

## 3. Still to do / open items

- [ ] Walk through the live site yourself: sign in with a test name, do one problem, then check `/admin` with the production code. Delete the test student afterwards.
- [ ] Turn on 2FA for your Vercel account.
- [ ] Write `README.md` and a project `CLAUDE.md`; add one line about this project to `C:\Users\thale\CLAUDE.md`.
- [ ] Clean up the local demo data (the "Demo Student" and "QA Tester" accounts in `.data/pglite`, the `test-results/` folder).
- [ ] Not tested yet: reduced-motion behavior, Safari and Firefox (the popup closes instantly there by design).
- [ ] Optional rename of the site address (Vercel: Settings, then Domains).
- [ ] Tell classmates the link well before 12/02.

## 4. Known notes

- Local dev server gets killed when the PC runs low on memory; restart with `npx next dev -p 3263` from this folder.
- In PowerShell use `npm.cmd` instead of `npm` (scripts are disabled on this PC).
- The admin code protects a class-wide data export. Do not share it, and do not reuse the local or test codes in production.
- The local dev overlay shows "1 Issue" (a harmless hydration warning from the table-scroll helper). It does not appear on the live site.

## 5. Things I want to add

> Fill this in. Write each idea in one line, and mark a priority (must have before the exam, nice to have, later).

| # | Idea | Priority | Notes |
|---|------|----------|-------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |

### Ideas already on the list from earlier sessions
- More original practice problems (only 4 exist so far: 5.4 has three, 5.7 has one).
- Edit problem figures from the admin editor (today they live in the content files).
- A rate limit on student sign-in.
- Export a student's notes.
- Possibly: an exam countdown with a daily plan, a "weak topics only" practice mode, a printable problem sheet.
