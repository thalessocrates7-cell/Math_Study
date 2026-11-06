import { Trash } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteStudentAction } from "@/app/actions/admin";
import { problemLabel, RatingPill } from "@/components/Badges";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { RenameStudentForm } from "@/components/forms/RenameStudentForm";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { formatMonthDay, todayISO } from "@/lib/dates";
import { studentDetail } from "@/server/admin";

export const metadata: Metadata = { title: "Admin · Student" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REASON: Record<string, string> = { got_it: "Retention check", shaky: "Shaky", lost: "Lost", similar: "Similar problem", easier: "Easier problem" };

function when(d: Date | null): string {
  if (!d) return "–";
  return `${formatMonthDay(todayISO(d))}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })}`;
}

export default async function StudentDetailPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID_RE.test(id)) notFound();
  const db = await getDb();
  const d = await studentDetail(db, id);
  if (!d) notFound();
  const name = `${d.student.firstName} ${d.student.lastName}`;

  return (
    <div className="page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/admin/students">Students</Link>
          </li>
          <li aria-current="page">{name}</li>
        </ol>
      </nav>
      <header className="page-header">
        <div>
          <h1>Student: {name}</h1>
          <p className="lede">
            Joined {formatMonthDay(todayISO(d.student.createdAt))} · last seen {formatMonthDay(todayISO(d.student.lastSeenAt))} · {d.noteCount} note
            {d.noteCount === 1 ? "" : "s"}
          </p>
        </div>
      </header>
      {sp.merged === "1" ? (
        <div className="alert alert-success" role="status" style={{ marginBottom: 16 }}>
          Accounts merged into {name}.
        </div>
      ) : null}

      <div className="grid grid-4">
        <div className="card">
          <div className="stat-value">{d.completed}</div>
          <div className="stat-label">Problems completed</div>
        </div>
        <div className="card">
          <div className="stat-value">{d.ratingPercents.got_it}%</div>
          <div className="stat-label">Got it</div>
        </div>
        <div className="card">
          <div className="stat-value">{d.ratingPercents.shaky}%</div>
          <div className="stat-label">Shaky</div>
        </div>
        <div className="card">
          <div className="stat-value">{d.ratingPercents.lost}%</div>
          <div className="stat-label">Lost</div>
        </div>
      </div>

      <section className="card section-gap" aria-labelledby="queue-title">
        <h2 id="queue-title" className="card-title">
          Current review queue
        </h2>
        {d.queue.length === 0 ? (
          <p className="small text-2">Nothing pending.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Problem</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Due</th>
                </tr>
              </thead>
              <tbody>
                {d.queue.map((q) => (
                  <tr key={q.id}>
                    <td>
                      {q.sectionId} · <Link href={`/admin/problems/${encodeURIComponent(q.problemId)}`}>{q.problemId}</Link>
                    </td>
                    <td>{REASON[q.reason] ?? q.reason}</td>
                    <td className="num">{formatMonthDay(q.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card section-gap" aria-labelledby="history-title">
        <h2 id="history-title" className="card-title">
          Problem history
        </h2>
        {d.history.length === 0 ? (
          <p className="small text-2">No problems opened yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Problem</th>
                  <th scope="col">Difficulty</th>
                  <th scope="col">Opened</th>
                  <th scope="col">Rated</th>
                  <th scope="col">Rating</th>
                  <th scope="col">Hint</th>
                  <th scope="col">Answer</th>
                  <th scope="col">Solution</th>
                  <th scope="col">From</th>
                </tr>
              </thead>
              <tbody>
                {d.history.map((h) => (
                  <tr key={h.id}>
                    <td>
                      {h.sectionId} · <Link href={`/admin/problems/${encodeURIComponent(h.problemId)}`}>{problemLabel(h.openstaxNumber, h.problemId)}</Link>
                    </td>
                    <td>{h.difficulty}</td>
                    <td className="num">{when(h.openedAt)}</td>
                    <td className="num">{when(h.ratedAt)}</td>
                    <td>{h.rating ? <RatingPill rating={h.rating as "got_it" | "shaky" | "lost"} /> : <span className="muted">Open</span>}</td>
                    <td>{h.hintUsed ? "Yes" : "–"}</td>
                    <td>{h.answerRevealed ? "Yes" : "–"}</td>
                    <td>{h.solutionViewed ? "Yes" : "–"}</td>
                    <td>{h.origin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid grid-2 section-gap">
        <section className="card" aria-labelledby="rename-title">
          <h2 id="rename-title" className="card-title">
            Edit name
          </h2>
          <p className="small text-2" style={{ marginBottom: 12 }}>
            Fix a misspelled name. If the new name belongs to another account, you can merge the two.
          </p>
          <RenameStudentForm id={d.student.id} first={d.student.firstName} last={d.student.lastName} />
        </section>
        <section className="card" aria-labelledby="delete-title">
          <h2 id="delete-title" className="card-title">
            Delete student
          </h2>
          <p className="small text-2" style={{ marginBottom: 12 }}>
            Permanently removes {name} and all of their attempts, reviews and notes. This cannot be undone.
          </p>
          <form action={deleteStudentAction}>
            <input type="hidden" name="id" value={d.student.id} />
            <ConfirmSubmit
              label={
                <>
                  <Trash size={16} aria-hidden="true" />
                  Delete student
                </>
              }
              title={`Delete ${name}?`}
              body={`All of ${name}'s progress will be permanently deleted. Export the CSV first if you need a record.`}
              confirmLabel="Delete permanently"
            />
          </form>
        </section>
      </div>
    </div>
  );
}
