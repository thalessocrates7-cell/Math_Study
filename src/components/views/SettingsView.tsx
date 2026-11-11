import { ArrowRight, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { ThemeChoice } from "@/components/forms/ThemeChoice";
import { PageTransition } from "@/components/PageTransition";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { DEFAULT_AVAILABILITY, describeAvailability, formatMinutes, parseAvailability, weeklyMinutes } from "@/lib/availability";
import { formatFullDate, todayISO } from "@/lib/dates";
import { formatExamTime, type Prep, routesFor } from "@/lib/prep";
import { readTheme } from "@/lib/session";
import { getExam, studentFor } from "@/server/settings";

/**
 * Settings of either environment (/settings or /final-exam/settings). The profile, appearance and
 * sign-out are the same account everywhere; the study schedule card is the environment's own.
 */
export async function SettingsView({ prep }: { prep: Prep }) {
  const student = await requireStudent();
  const [theme, exam] = await Promise.all([readTheme(), getDb().then((db) => getExam(db, prep))]);
  const final = prep === "final";
  const routes = routesFor(prep);
  const pref = student.theme === "light" || student.theme === "dark" ? student.theme : theme;
  const own = studentFor(prep, student);
  const saved = parseAvailability(own.availability);
  const availability = saved ?? DEFAULT_AVAILABILITY;
  const time = formatExamTime(exam.time);
  return (
    <PageTransition>
      <div className="page page-narrow">
        <header className="page-header">
          <div>
            <h1>Settings</h1>
            <p className="lede">{final ? "Your profile, Final Exam study schedule, appearance and sign-out." : "Your profile, study schedule, appearance and sign-out."}</p>
          </div>
        </header>
        <div className="stack">
          <section className="card" aria-labelledby="profile-title">
            <h2 id="profile-title" className="card-title">
              Profile
            </h2>
            <dl className="kv" style={{ maxWidth: 420 }}>
              <dt>Name</dt>
              <dd>
                {student.firstName} {student.lastName}
              </dd>
              <dt>Joined</dt>
              <dd>{formatFullDate(todayISO(student.createdAt))}</dd>
            </dl>
            <p className="small text-2" style={{ marginTop: 12 }}>
              Your account is your name: anyone who signs in with the same first and last name opens this plan. To fix a spelling mistake,
              ask your instructor; they can rename or merge accounts.
            </p>
          </section>
          <section className="card" aria-labelledby="schedule-title">
            <div className="card-head">
              <h2 id="schedule-title" className="card-title">
                {final ? "Final Exam study schedule" : "Study schedule"}
              </h2>
              {saved ? null : <span className="pill pill-warning">Not set up yet</span>}
            </div>
            <dl className="kv" style={{ maxWidth: 520 }}>
              <dt>When</dt>
              <dd>{describeAvailability(availability)}</dd>
              <dt>Each week</dt>
              <dd className="num">{formatMinutes(weeklyMinutes(availability))}</dd>
              <dt>Exam date</dt>
              <dd>
                {formatFullDate(own.examDateOverride ?? exam.classDate)}
                {time ? ` at ${time} ET` : ""}
                {own.examDateOverride ? " (your own date)" : ""}
              </dd>
            </dl>
            <p className="small text-2" style={{ margin: "12px 0" }}>
              {final
                ? "Your Final Exam sessions are planned to fit this time. It's separate from your Integration Review schedule."
                : "Each study session is planned to fit this time. Change it whenever your week changes."}
            </p>
            <Link className="btn btn-secondary" href={routes.schedule}>
              Change schedule
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </section>
          <section className="card" aria-labelledby="appearance-title">
            <h2 id="appearance-title" className="card-title">
              Appearance
            </h2>
            <ThemeChoice initial={pref} />
          </section>
          <section className="card" aria-labelledby="privacy-title">
            <h2 id="privacy-title" className="card-title">
              Privacy
            </h2>
            <p className="small text-2">
              This site stores only your name, your study schedule and your study progress (which problems you opened, how long each one was
              on screen, whether you used a hint, the answer or the worked solution, your ratings, which problems you ticked off, and your notes). Your instructor can see your progress. There is no email, password or tracking.
            </p>
          </section>
          <section className="card" aria-labelledby="signout-title">
            <h2 id="signout-title" className="card-title">
              Sign out
            </h2>
            <p className="small text-2" style={{ marginBottom: 12 }}>
              Sign out on shared computers. You can sign back in with your name any time.
            </p>
            <form action={signOut}>
              <button className="btn btn-secondary" type="submit">
                <LogOut size={18} aria-hidden="true" />
                Sign out
              </button>
            </form>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
