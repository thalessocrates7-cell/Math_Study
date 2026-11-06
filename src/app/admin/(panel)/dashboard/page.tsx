import { ArrowRight, CircleCheck, CircleX, Gauge, RotateCcw, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { problemLabel, RatingPill } from "@/components/Badges";
import { SectionBars } from "@/components/charts";
import { ProgressBar } from "@/components/Progress";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { formatMonthDay, todayISO } from "@/lib/dates";
import { classOverview } from "@/server/admin";

export const metadata: Metadata = { title: "Admin · Class Overview" };

export default async function AdminDashboard() {
  await requireAdmin();
  const db = await getDb();
  const today = todayISO();
  const o = await classOverview(db, today);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin dashboard · MTH 263</p>
          <h1>Class Overview</h1>
          <p className="lede">Student progress and platform activity.</p>
        </div>
      </header>

      <div className="grid grid-4">
        <div className="card stat">
          <span className="stat-icon tone-accent" aria-hidden="true">
            <Users size={20} />
          </span>
          <div>
            <div className="stat-value">{o.totalStudents}</div>
            <div className="stat-label">Students ({o.activeThisWeek} active this week)</div>
          </div>
        </div>
        <div className="card stat">
          <span className="stat-icon tone-success" aria-hidden="true">
            <Gauge size={20} />
          </span>
          <div>
            <div className="stat-value">{o.avgProgress}%</div>
            <div className="stat-label">Average plan progress</div>
          </div>
        </div>
        <div className="card stat">
          <span className="stat-icon tone-accent" aria-hidden="true">
            <CircleCheck size={20} />
          </span>
          <div>
            <div className="stat-value">{o.avgCompleted}</div>
            <div className="stat-label">Avg problems completed</div>
          </div>
        </div>
        <div className="card stat">
          <span className="stat-icon tone-warning" aria-hidden="true">
            <RotateCcw size={20} />
          </span>
          <div>
            <div className="stat-value">{o.needReview}</div>
            <div className="stat-label">Students with problems to review</div>
          </div>
        </div>
      </div>

      <div className="dash-main">
        <section className="card" aria-labelledby="students-title">
          <div className="card-head">
            <h2 id="students-title" className="card-title">
              Student Progress
            </h2>
            <Link className="card-link" href="/admin/students">
              All students <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          {o.rows.length === 0 ? (
            <p className="small text-2">No students yet. Students appear here after they sign in for the first time.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Student</th>
                    <th scope="col" style={{ minWidth: 160 }}>
                      Progress
                    </th>
                    <th scope="col" className="numcol">
                      To review
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...o.rows]
                    .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime())
                    .slice(0, 8)
                    .map((r) => (
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
                        <td className="numcol">{r.toReview}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card" aria-labelledby="missed-title">
          <h2 id="missed-title" className="card-title">
            Most Missed Topics
          </h2>
          {o.mostMissed.length === 0 ? (
            <p className="small text-2">No problems rated Lost yet.</p>
          ) : (
            <ul className="list">
              {o.mostMissed.map((m) => (
                <li key={m.sectionId} className="row-link" style={{ cursor: "default" }}>
                  <span className="reason-icon tone-danger" aria-hidden="true">
                    <CircleX size={18} />
                  </span>
                  <span className="row-main">
                    <span className="row-title small">
                      {m.sectionId} – {m.title}
                    </span>
                    <span className="row-sub">
                      {m.lost} problem{m.lost === 1 ? "" : "s"} currently rated Lost
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card section-gap" aria-labelledby="class-ratings-title">
        <h2 id="class-ratings-title" className="card-title">
          Ratings by section (whole class)
        </h2>
        <p className="small text-2" style={{ marginBottom: 16 }}>
          Latest rating of every student-problem pair, grouped by section.
        </p>
        <SectionBars
          caption="Class ratings by section"
          includeNew={false}
          rows={o.bySection.map((b) => ({
            id: b.sectionId,
            label: `${b.sectionId} ${b.title}`,
            got: b.got_it,
            shaky: b.shaky,
            lost: b.lost,
            new: 0,
            valueText: `${b.got_it + b.shaky + b.lost} rated`,
          }))}
        />
      </section>

      <section className="card section-gap" aria-labelledby="activity-title">
        <h2 id="activity-title" className="card-title">
          Recent Activity
        </h2>
        {o.recent.length === 0 ? (
          <p className="small text-2">No problems rated yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Problem</th>
                  <th scope="col">Rating</th>
                  <th scope="col">When</th>
                </tr>
              </thead>
              <tbody>
                {o.recent.map((r, i) => (
                  <tr key={`${r.studentId}-${r.problemId}-${i}`}>
                    <td>
                      <Link href={`/admin/students/${r.studentId}`}>{r.name}</Link>
                    </td>
                    <td>
                      {r.sectionId} · {problemLabel(r.openstaxNumber, r.problemId)} ({r.difficulty})
                    </td>
                    <td>
                      <RatingPill rating={r.rating as "got_it" | "shaky" | "lost"} />
                    </td>
                    <td className="num">
                      {formatMonthDay(todayISO(r.ratedAt))}{" "}
                      {r.ratedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
