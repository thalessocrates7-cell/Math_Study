import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SECTIONS } from "@content/index";
import { DIFFICULTIES, DIFFICULTY_LABEL, type Difficulty } from "@content/types";
import { DifficultyBadge, problemLabel } from "@/components/Badges";
import { Preview } from "@/components/Rich";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { listProblems } from "@/server/admin";
import { PageTransition } from "@/components/PageTransition";

export const metadata: Metadata = { title: "Admin · Problem Bank" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ProblemsPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const section = typeof sp.section === "string" && SECTIONS.some((s) => s.id === sp.section) ? sp.section : "";
  const difficulty = typeof sp.difficulty === "string" && ["F", "C", "Ch"].includes(sp.difficulty) ? (sp.difficulty as Difficulty) : undefined;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const includeInactive = sp.inactive === "1";
  const db = await getDb();
  const rows = await listProblems(db, { section: section || undefined, difficulty, search: q, includeInactive });

  return (
    <PageTransition>
      <div className="page">
        <header className="page-header">
          <div>
            <h1>Problem Bank</h1>
            <p className="lede">OpenStax and custom problems. Edit hints, answers, steps and difficulty.</p>
          </div>
          <Link className="btn btn-primary" href="/admin/problems/new">
            <Plus size={18} aria-hidden="true" />
            Add problem
          </Link>
        </header>
        {sp.deleted === "1" ? (
          <div className="alert alert-success" role="status" style={{ marginBottom: 16 }}>
            Problem deleted.
          </div>
        ) : null}
        <section className="card">
          <form className="toolbar" action="/admin/problems" role="search">
            <div className="field">
              <label className="label" htmlFor="f-section">
                Section
              </label>
              <select id="f-section" name="section" className="select" defaultValue={section}>
                <option value="">All sections</option>
                {SECTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="f-diff">
                Difficulty
              </label>
              <select id="f-diff" name="difficulty" className="select" defaultValue={difficulty ?? ""}>
                <option value="">All levels</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {DIFFICULTY_LABEL[d]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field grow">
              <label className="label" htmlFor="f-q">
                Search
              </label>
              <div className="input-wrap">
                <Search size={18} aria-hidden="true" />
                <input id="f-q" name="q" type="search" className="input" defaultValue={q} placeholder="ID or text, e.g. 5.2-80 or sqrt" />
              </div>
            </div>
            <label className="checkbox" style={{ alignSelf: "center" }}>
              <input type="checkbox" name="inactive" value="1" defaultChecked={includeInactive} />
              Include retired
            </label>
            <button className="btn btn-secondary" type="submit">
              Filter
            </button>
          </form>
          <p className="small text-2" style={{ marginBottom: 8 }} aria-live="polite">
            {rows.length} problem{rows.length === 1 ? "" : "s"}
          </p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Section</th>
                  <th scope="col">Difficulty</th>
                  <th scope="col">Problem</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="num" style={{ whiteSpace: "nowrap" }}>
                      {r.id}
                    </td>
                    <td>{r.sectionId}</td>
                    <td>
                      <DifficultyBadge d={r.difficulty} />
                    </td>
                    <td style={{ minWidth: 240 }}>
                      <span className="xsmall muted">{problemLabel(r.openstaxNumber, r.id)}</span>
                      <br />
                      <Preview src={r.statement} />
                    </td>
                    <td>
                      {r.active ? <span className="pill pill-success">Active</span> : <span className="pill pill-neutral">Retired</span>}
                      {r.editedByAdmin ? (
                        <>
                          {" "}
                          <span className="pill pill-accent">Edited</span>
                        </>
                      ) : null}
                    </td>
                    <td>
                      <Link className="btn btn-ghost btn-sm" href={`/admin/problems/${encodeURIComponent(r.id)}`}>
                        Edit<span className="sr-only"> {r.id}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
