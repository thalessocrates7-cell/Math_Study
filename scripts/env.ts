import { existsSync } from "node:fs";

/** Loads .env.local (if present) for scripts run outside Next.js. */
export function loadLocalEnv() {
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) process.loadEnvFile(file);
  }
}

export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || undefined;
}
