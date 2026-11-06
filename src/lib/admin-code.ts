import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Stored format: scrypt:N:r:p:salt:hash (base64url). ":" is used instead of "$" so the value
// survives .env files, where "$NAME" would be expanded as a variable.
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 32;

export function hashAdminCode(code: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(code.normalize("NFC"), salt, KEYLEN, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64url"), hash.toString("base64url")].join(":");
}

export function verifyAdminCode(code: string, stored: string | undefined): boolean {
  if (!stored) return false;
  const parts = stored.trim().split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, "base64url");
  if (expected.length === 0) return false;
  let actual: Buffer;
  try {
    actual = scryptSync(code.normalize("NFC"), Buffer.from(saltB64, "base64url"), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
  } catch {
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
