import { createHash } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { cookies, headers } from "next/headers";

export const STUDENT_COOKIE = "mth_student";
export const ADMIN_COOKIE = "mth_admin";
export const THEME_COOKIE = "mth_theme";

const STUDENT_DAYS = 180;
const ADMIN_HOURS = 12;
const DEV_SECRET = "dev-only-insecure-secret-change-me-0123456789";
let warned = false;

function secretKey(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 32) return new TextEncoder().encode(value);
  if (process.env.VERCEL || process.env.REQUIRE_SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set to a random string of at least 32 characters.");
  }
  if (!warned) {
    console.warn("[mth263] SESSION_SECRET is not set; using an insecure development secret.");
    warned = true;
  }
  return new TextEncoder().encode(DEV_SECRET);
}

const cookieBase = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createStudentSession(studentId: string): Promise<void> {
  const token = await new SignJWT({ role: "student" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(studentId)
    .setIssuedAt()
    .setExpirationTime(`${STUDENT_DAYS}d`)
    .sign(secretKey());
  (await cookies()).set(STUDENT_COOKIE, token, { ...cookieBase(), maxAge: STUDENT_DAYS * 86_400 });
}

export async function readStudentId(): Promise<string | null> {
  const token = (await cookies()).get(STUDENT_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.role !== "student" || typeof payload.sub !== "string" || !UUID_RE.test(payload.sub)) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export async function clearStudentSession(): Promise<void> {
  (await cookies()).delete(STUDENT_COOKIE);
}

export async function createAdminSession(): Promise<void> {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_HOURS}h`)
    .sign(secretKey());
  (await cookies()).set(ADMIN_COOKIE, token, { ...cookieBase(), maxAge: ADMIN_HOURS * 3600 });
}

export async function readAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}

export type ThemePref = "light" | "dark" | "system";

export async function readTheme(): Promise<ThemePref> {
  const v = (await cookies()).get(THEME_COOKIE)?.value;
  return v === "light" || v === "dark" ? v : "system";
}

export async function writeTheme(theme: ThemePref): Promise<void> {
  const jar = await cookies();
  if (theme === "system") jar.delete(THEME_COOKIE);
  else jar.set(THEME_COOKIE, theme, { ...cookieBase(), httpOnly: false, maxAge: 365 * 86_400 });
}

/** A one-way hash of the client IP (salted with the session secret), for login rate limiting. */
export async function clientIpHash(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  return createHash("sha256").update(ip).update(secretKey()).digest("hex").slice(0, 32);
}
