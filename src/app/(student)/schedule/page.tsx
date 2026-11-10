import type { Metadata } from "next";
import Link from "next/link";
import { ScheduleForm } from "@/components/forms/ScheduleForm";
import { PageTransition } from "@/components/PageTransition";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { DEFAULT_AVAILABILITY, parseAvailability } from "@/lib/availability";
import { todayISO } from "@/lib/dates";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = { title: "Study Schedule" };

export default async function SchedulePage() {
  const student = await requireStudent();
  const db = await getDb();
  const settings = await getSettings(db);
  const saved = parseAvailability(student.availability);

  return (
    <PageTransition>
      <div className="page page-narrow">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href="/settings">Settings</Link>
            </li>
            <li aria-current="page">Study schedule</li>
          </ol>
        </nav>
        <header className="page-header">
          <div>
            <h1>Study schedule</h1>
            <p className="lede">When you can study before the exam. Your plan adjusts as soon as you save.</p>
          </div>
        </header>

        <ScheduleForm
          initial={saved ?? DEFAULT_AVAILABILITY}
          examDate={student.examDateOverride ?? settings.examDate}
          classExamDate={settings.examDate}
          today={todayISO()}
        />
      </div>
    </PageTransition>
  );
}
