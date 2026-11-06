import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { signOut } from "@/app/actions/auth";
import { ThemeChoice } from "@/components/forms/ThemeChoice";
import { requireStudent } from "@/lib/auth";
import { formatFullDate, todayISO } from "@/lib/dates";
import { readTheme } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const student = await requireStudent();
  const theme = await readTheme();
  const pref = student.theme === "light" || student.theme === "dark" ? student.theme : theme;
  return (
    <div className="page page-narrow">
      <header className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="lede">Your profile, appearance and sign-out.</p>
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
            This site stores only your name and your study progress (which problems you opened, whether you used a hint, the answer or the
            worked solution, your ratings, and your notes). Your instructor can see your progress. There is no email, password or tracking.
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
  );
}
