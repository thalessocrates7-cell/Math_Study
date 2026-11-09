import { ArrowRight, LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { ThemeChoice } from "@/components/forms/ThemeChoice";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { DEFAULT_AVAILABILITY, describeAvailability, formatMinutes, parseAvailability, weeklyMinutes } from "@/lib/availability";
import { formatFullDate, todayISO } from "@/lib/dates";
import { readTheme } from "@/lib/session";
import { getSettings } from "@/server/settings";
import { PageTransition } from "@/components/PageTransition";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const student = await requireStudent();
  const [theme, settings] = await Promise.all([readTheme(), getDb().then(getSettings)]);
  const pref = student.theme === "light" || student.theme === "dark" ? student.theme : theme;
  const saved = parseAvailability(student.availability);
  const availability = saved ?? DEFAULT_AVAILABILITY;
  return (
    <PageTransition>
      <div className="page page-narrow">
        <header className="page-header">
          <div>
            <h1>Settings</h1>
            <p className="lede">Your profile, study schedule, appearance and sign-out.</p>
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
                Study schedule
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
                {formatFullDate(student.examDateOverride ?? settings.examDate)}
                {student.examDateOverride ? " (your own date)" : ""}
              </dd>
              <dt>Extra sections</dt>
              <dd>{student.supplementaryOptIn ? "Included" : "Off"}</dd>
            </dl>
            <p className="small text-2" style={{ margin: "12px 0" }}>
              Each study session is planned to fit this time. Change it whenever your week changes.
            </p>
            <Link className="btn btn-secondary" href="/schedule">
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
              on screen, whether you used a hint, the answer or the worked solution, your ratings, and your notes). Your instructor can see your progress. There is no email, password or tracking.
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
