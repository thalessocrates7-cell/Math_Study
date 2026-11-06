import { getDb } from "@/db/client";
import { todayISO } from "@/lib/dates";
import { readAdmin } from "@/lib/session";
import { attemptsCsv } from "@/server/admin";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  if (!(await readAdmin())) {
    return new Response("Sign in at /admin first.", { status: 401, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  const db = await getDb();
  const csv = await attemptsCsv(db);
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mth263-attempts-${todayISO()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
