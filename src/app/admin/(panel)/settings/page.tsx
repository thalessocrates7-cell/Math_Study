import { Download, Trash } from "lucide-react";
import type { Metadata } from "next";
import { purgeStudentsAction } from "@/app/actions/admin";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = { title: "Admin · Settings" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminSettingsPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const db = await getDb();
  const settings = await getSettings(db);
  return (
    <div className="page page-narrow">
      <header className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="lede">Exam details, data export and data retention.</p>
        </div>
      </header>
      {sp.purge === "done" ? (
        <div className="alert alert-success" role="status" style={{ marginBottom: 16 }}>
          All student accounts and progress were deleted.
        </div>
      ) : null}
      {sp.purge === "cancelled" ? (
        <div className="alert alert-info" role="status" style={{ marginBottom: 16 }}>
          Nothing was deleted: the confirmation word didn&apos;t match.
        </div>
      ) : null}
      <div className="stack">
        <section className="card" aria-labelledby="exam-title">
          <h2 id="exam-title" className="card-title">
            Exam
          </h2>
          <SettingsForm examName={settings.examName} examDate={settings.examDate} />
        </section>
        <section className="card" aria-labelledby="export-title">
          <h2 id="export-title" className="card-title">
            Export
          </h2>
          <p className="small text-2" style={{ marginBottom: 12 }}>
            Every attempt (student, problem, hints and answer used, rating, next review) as a CSV file for a spreadsheet.
          </p>
          <a className="btn btn-secondary" href="/admin/export">
            <Download size={18} aria-hidden="true" />
            Download attempts CSV
          </a>
        </section>
        <section className="card" aria-labelledby="access-title">
          <h2 id="access-title" className="card-title">
            Admin access
          </h2>
          <p className="small text-2">
            The access code is stored only as a hash in the <code>ADMIN_CODE_HASH</code> environment variable. To change it, run{" "}
            <code>npm run admin:hash -- &quot;new code&quot;</code> and update the variable where the site is hosted. Five wrong codes in 15
            minutes from one network lock sign-in for 15 minutes.
          </p>
        </section>
        <section className="card" aria-labelledby="retention-title">
          <h2 id="retention-title" className="card-title">
            Data retention
          </h2>
          <p className="small text-2" style={{ marginBottom: 12 }}>
            After the course ends, export the CSV if you need it, then delete all student accounts and their progress. Problems, the study plan
            and these settings are kept.
          </p>
          <form action={purgeStudentsAction}>
            <ConfirmSubmit
              label={
                <>
                  <Trash size={16} aria-hidden="true" />
                  Delete all student data
                </>
              }
              title="Delete all student data?"
              body="Every student account, attempt, review and note will be permanently deleted. This cannot be undone."
              confirmLabel="Delete everything"
              typeToConfirm="DELETE"
            />
          </form>
        </section>
      </div>
    </div>
  );
}
