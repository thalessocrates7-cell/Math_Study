import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ScheduleForm } from "@/components/forms/ScheduleForm";
import { PageTransition } from "@/components/PageTransition";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { DEFAULT_AVAILABILITY, parseAvailability } from "@/lib/availability";
import { todayISO } from "@/lib/dates";
import { getSettings } from "@/server/settings";
import { ratedAttemptCount } from "@/server/students";

export const metadata: Metadata = { title: "Study Schedule" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SchedulePage({ searchParams }: Props) {
  const student = await requireStudent();
  const sp = await searchParams;
  const db = await getDb();
  const [settings, rated] = await Promise.all([getSettings(db), ratedAttemptCount(db, student.id)]);
  // The setup view is for the first visit; once saved, this page is the editor.
  const setup = sp.setup === "1" && !student.onboardedAt;
  const saved = parseAvailability(student.availability);

  return (
    <PageTransition>
      <div className="page page-narrow">
        {setup ? null : (
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol>
              <li>
                <Link href="/settings">Settings</Link>
              </li>
              <li aria-current="page">Study schedule</li>
            </ol>
          </nav>
        )}
        <header className="page-header">
          <div>
            <h1>{setup ? "Set up your study schedule" : "Study schedule"}</h1>
            <p className="lede">
              {setup
                ? "Tell the plan when you can study. Each session is planned to fit the time you have."
                : "When you can study before the exam. Your plan adjusts as soon as you save."}
            </p>
          </div>
        </header>

        {setup && rated > 0 ? (
          <section className="alert alert-info upgrade-note" aria-labelledby="upgrade-title">
            <Sparkles size={18} aria-hidden="true" />
            <div className="stack-sm">
              <h2 id="upgrade-title" className="small" style={{ fontWeight: 700 }}>
                We&apos;ve upgraded your study plan
              </h2>
              <ul className="small">
                <li>Your work so far is kept. From now on, each study session is planned to fit your time.</li>
                <li>Problems you got right come back as short look-backs at earlier units, instead of a fixed 14-day re-check.</li>
                <li>
                  &ldquo;Demonstrated understanding&rdquo; now needs a Core problem and a harder one on a later day, both without the worked
                  solution. Your count may start lower than your old &ldquo;mastered&rdquo; count.
                </li>
              </ul>
            </div>
          </section>
        ) : null}

        <ScheduleForm
          setup={setup}
          initial={saved ?? DEFAULT_AVAILABILITY}
          examDate={student.examDateOverride ?? settings.examDate}
          classExamDate={settings.examDate}
          today={todayISO()}
        />
      </div>
    </PageTransition>
  );
}
