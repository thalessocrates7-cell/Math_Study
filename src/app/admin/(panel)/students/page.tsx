import { Download, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProgressBar } from "@/components/Progress";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { formatMonthDay, todayISO } from "@/lib/dates";
import { studentRows } from "@/server/admin";
import { PageTransition } from "@/components/PageTransition";

export const metadata: Metadata = { title: "Admin · Students" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function StudentsPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  const db = await getDb();
  const today = todayISO();
  const rows = await studentRows(db, today, q);

  return (
    <PageTransition>
      <div className="page">
        <header className="page-header">
          <div>
            <h1>Students</h1>
            <p className="lede">Everyone who has signed in, with their study plan progress.</p>
          </div>
          <a className="btn btn-secondary" href="/admin/export">
            <Download size={18} aria-hidden="true" />
            Export CSV
          </a>
        </header>
        {sp.deleted === "1" ? (
          <div className="alert alert-success" role="status" style={{ marginBottom: 16 }}>
            The student and their progress were deleted.
          </div>
        ) : null}
        <section className="card">
          <form className="toolbar" role="search" action="/admin/students">
            <div className="field grow">
              <label className="label" htmlFor="q">
                Search by name
              </label>
              <div className="input-wrap">
                <Search size={18} aria-hidden="true" />
                <input id="q" name="q" type="search" className="input" defaultValue={q} placeholder="First or last name" />
              </div>
            </div>
            <button className="btn btn-secondary" type="submit">
              Search
            </button>
            {q ? (
              <Link className="btn btn-ghost" href="/admin/students">
                Clear
              </Link>
            ) : null}
          </form>
          <p className="small text-2" style={{ marginBottom: 8 }} aria-live="polite">
            {rows.length} student{rows.length === 1 ? "" : "s"}
            {q ? ` matching “${q}”` : ""}
          </p>
          {rows.length === 0 ? (
            <p className="small text-2">{q ? "No students match that search." : "No students yet. They appear after their first sign-in."}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col" style={{ minWidth: 170 }}>
                      Progress
                    </th>
                    <th scope="col" className="numcol">
                      Completed
                    </th>
                    <th scope="col" className="numcol">
                      To review
                    </th>
                    <th scope="col" className="numcol">
                      Due now
                    </th>
                    <th scope="col">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.student.id}>
                      <td>
                        <Link href={`/admin/students/${r.student.id}`}>
                          {r.student.lastName}, {r.student.firstName}
                        </Link>
                      </td>
                      <td>
                        <div className="cluster" style={{ flexWrap: "nowrap" }}>
                          <div style={{ flex: 1, minWidth: 80 }}>
                            <ProgressBar value={r.done} max={r.assigned} label={`${r.student.firstName} ${r.student.lastName} progress`} />
                          </div>
                          <span className="num small">{r.progress}%</span>
                        </div>
                      </td>
                      <td className="numcol">
                        {r.done}/{r.assigned}
                      </td>
                      <td className="numcol">{r.toReview}</td>
                      <td className="numcol">{r.dueNow}</td>
                      <td className="num">{formatMonthDay(todayISO(r.lastActive))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
