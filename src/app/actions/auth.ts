"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { verifyAdminCode } from "@/lib/admin-code";
import { currentStudent } from "@/lib/auth";
import { normalizeName } from "@/lib/names";
import {
  clearAdminSession,
  clearStudentSession,
  clientIpHash,
  createAdminSession,
  createStudentSession,
  writeTheme,
  type ThemePref,
} from "@/lib/session";
import {
  clearLoginFailures,
  LOGIN_MAX_FAILURES,
  recentLoginFailures,
  recordLoginFailure,
  recordStudentSignIn,
  studentSignInRetryAt,
} from "@/server/admin";
import { findOrCreateStudent, setStudentTheme } from "@/server/students";

export type SignInState = {
  error?: string;
  field?: "first" | "last" | "both";
  values?: { first: string; last: string };
};

function minutesUntil(at: Date): string {
  const minutes = Math.max(1, Math.ceil((at.getTime() - Date.now()) / 60_000));
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const first = String(formData.get("first") ?? "");
  const last = String(formData.get("last") ?? "");
  const name = normalizeName(first, last);
  if (!name.ok) return { error: name.error, field: name.field, values: { first, last } };
  const db = await getDb();
  const ip = await clientIpHash();
  const retryAt = await studentSignInRetryAt(db, ip);
  if (retryAt) return { error: `Too many sign-ins from this network. Try again in ${minutesUntil(retryAt)}.`, values: { first, last } };
  await recordStudentSignIn(db, ip);
  const { student } = await findOrCreateStudent(db, name.first, name.last);
  await createStudentSession(student.id);
  if (student.theme === "light" || student.theme === "dark") await writeTheme(student.theme);
  // First visit since the adaptive planner: set up a study schedule before anything else.
  redirect(student.onboardedAt ? "/dashboard" : "/schedule?setup=1");
}

export async function signOut(): Promise<void> {
  await clearStudentSession();
  redirect("/");
}

export async function setTheme(theme: ThemePref): Promise<void> {
  if (theme !== "light" && theme !== "dark" && theme !== "system") return;
  await writeTheme(theme);
  const student = await currentStudent();
  if (student) {
    const db = await getDb();
    await setStudentTheme(db, student.id, theme);
  }
}

export type AdminSignInState = { error?: string };

export async function adminSignIn(_prev: AdminSignInState, formData: FormData): Promise<AdminSignInState> {
  const code = String(formData.get("code") ?? "");
  const stored = process.env.ADMIN_CODE_HASH;
  if (!stored) return { error: "Admin access isn't set up yet. Set ADMIN_CODE_HASH on the server (see the README)." };
  const db = await getDb();
  const ip = await clientIpHash();
  const { count, retryAt } = await recentLoginFailures(db, ip);
  if (retryAt) return { error: `Too many attempts. Try again in ${minutesUntil(retryAt)}.` };
  if (!code || !verifyAdminCode(code, stored)) {
    await recordLoginFailure(db, ip);
    const left = LOGIN_MAX_FAILURES - count - 1;
    return { error: left > 0 ? `That access code is not correct. ${left} attempt${left === 1 ? "" : "s"} left.` : "That access code is not correct." };
  }
  await clearLoginFailures(db, ip);
  await createAdminSession();
  redirect("/admin/dashboard");
}

export async function adminSignOut(): Promise<void> {
  await clearAdminSession();
  redirect("/admin");
}
