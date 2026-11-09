import { existsSync } from "node:fs";

/** Loads .env.local (if present) for scripts run outside Next.js. */
export function loadLocalEnv() {
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) process.loadEnvFile(file);
  }
}

/**
 * Preview builds must never change the shared database: Neon is connected to all environments, so a
 * preview of a work-in-progress branch would migrate and re-seed the live site's data. Production builds
 * are unaffected. Set ALLOW_PREVIEW_DB_WRITES=1 on Vercel only once previews have their own database.
 */
export function skipOnPreview(task: string) {
  if (process.env.VERCEL_ENV === "preview" && process.env.ALLOW_PREVIEW_DB_WRITES !== "1") {
    console.log(`Preview build: skipping ${task} so the shared database is never changed.`);
    process.exit(0);
  }
}

export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || undefined;
}

/**
 * On Vercel there is no local fallback (its disk is read-only), so a missing database must stop the
 * build with instructions instead of shipping a site that errors on every page.
 */
export function failIfVercelWithoutDatabase(url: string | undefined) {
  if (url || !process.env.VERCEL) return;
  console.error(
    "\nNo database is connected to this Vercel project yet.\n" +
      "Open the project in Vercel > Storage > connect the Neon database (all environments), then Redeploy.\n",
  );
  process.exit(1);
}
