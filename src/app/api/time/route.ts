import { getDb } from "@/db/client";
import { readStudentId } from "@/lib/session";
import { addAttemptTime } from "@/server/practice";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Saves from the quiet timer: the workspace posts {"a": attemptId, "s": seconds} with
 * navigator.sendBeacon every couple of minutes and whenever the page is hidden or closed.
 * Only this site can post here: the sign-in cookie is SameSite=Lax, and cross-site requests are refused.
 */
export async function POST(request: Request): Promise<Response> {
  if (request.headers.get("sec-fetch-site") === "cross-site") return new Response(null, { status: 403 });
  const studentId = await readStudentId();
  if (!studentId) return new Response(null, { status: 401 });
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 300) return new Response(null, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const { a, s } = (body ?? {}) as { a?: unknown; s?: unknown };
  if (typeof a !== "string" || !UUID_RE.test(a)) return new Response(null, { status: 400 });
  const db = await getDb();
  await addAttemptTime(db, studentId, a, Number(s));
  return new Response(null, { status: 204 });
}
