import Link from "next/link";
import { ScheduleForm } from "@/components/forms/ScheduleForm";
import { PageTransition } from "@/components/PageTransition";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { DEFAULT_AVAILABILITY, parseAvailability } from "@/lib/availability";
import { todayISO } from "@/lib/dates";
import { type Prep, routesFor } from "@/lib/prep";
import { getExam, studentFor } from "@/server/settings";

/** The study schedule editor of either environment: Integration Review's, or the Final Exam's own. */
export async function ScheduleView({ prep }: { prep: Prep }) {
  const student = await requireStudent();
  const db = await getDb();
  const exam = await getExam(db, prep);
  const own = studentFor(prep, student);
  const saved = parseAvailability(own.availability);
  const final = prep === "final";

  return (
    <PageTransition>
      <div className="page page-narrow">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href={routesFor(prep).settings}>Settings</Link>
            </li>
            <li aria-current="page">{final ? "Final Exam study schedule" : "Study schedule"}</li>
          </ol>
        </nav>
        <header className="page-header">
          <div>
            <h1>{final ? "Final Exam study schedule" : "Study schedule"}</h1>
            <p className="lede">
              {final
                ? "When you can study for the Final Exam. It's separate from your Integration Review schedule, and your plan adjusts as soon as you save."
                : "When you can study before the exam. Your plan adjusts as soon as you save."}
            </p>
          </div>
        </header>

        <ScheduleForm initial={saved ?? DEFAULT_AVAILABILITY} examDate={own.examDateOverride ?? exam.classDate} classExamDate={exam.classDate} today={todayISO()} prep={prep} />
      </div>
    </PageTransition>
  );
}
