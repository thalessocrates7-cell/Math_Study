import type { Metadata } from "next";
import { PlanBuilder } from "@/components/admin/PlanBuilder";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { planRows } from "@/server/admin";

export const metadata: Metadata = { title: "Admin · Study Plan Builder" };

export default async function PlanBuilderPage() {
  await requireAdmin();
  const db = await getDb();
  const rows = await planRows(db);
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Study Plan Builder</h1>
          <p className="lede">
            How many Foundation, Core and Challenge problems each student gets per section. The default is 15 (5 / 7 / 3); leave spares in the
            pool so Shaky and Lost ratings can schedule similar and easier problems.
          </p>
        </div>
      </header>
      <section className="card">
        <PlanBuilder
          rows={rows.map((r) => ({
            sectionId: r.sectionId,
            title: r.title,
            counts: { F: r.counts.foundation, C: r.counts.core, Ch: r.counts.challenge },
            pool: r.pool,
          }))}
        />
      </section>
    </div>
  );
}
