/**
 * Seeds sections, problems, default plan and exam settings into DATABASE_URL.
 * Safe to re-run: existing rows are kept. Pass --force to refresh problem text from content/
 * (problems an admin edited are never overwritten).
 */
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import type { DB } from "../src/db/client";
import * as schema from "../src/db/schema";
import { seedDatabase } from "../src/db/seed";
import { databaseUrl, failIfVercelWithoutDatabase, loadLocalEnv, skipOnPreview } from "./env";

skipOnPreview("the seed");
loadLocalEnv();
const url = databaseUrl();
failIfVercelWithoutDatabase(url);
if (!url) {
  console.log("DATABASE_URL is not set: skipping. (Locally the app uses PGlite, which seeds itself.)");
  process.exit(0);
}

const pool = new pg.Pool({ connectionString: url, max: 1 });
try {
  const db = drizzle({ client: pool, schema }) as unknown as DB;
  const { inserted } = await seedDatabase(db, { force: process.argv.includes("--force") });
  console.log(`Seed complete (${inserted} problem rows inserted or refreshed).`);
} finally {
  await pool.end();
}
