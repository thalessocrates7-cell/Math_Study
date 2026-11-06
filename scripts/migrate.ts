/** Applies drizzle/ migrations to the Postgres database in DATABASE_URL (Neon in production). */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { databaseUrl, failIfVercelWithoutDatabase, loadLocalEnv } from "./env";

loadLocalEnv();
const url = databaseUrl();
failIfVercelWithoutDatabase(url);
if (!url) {
  console.log("DATABASE_URL is not set: skipping. (Locally the app uses PGlite, which migrates itself.)");
  process.exit(0);
}

const pool = new pg.Pool({ connectionString: url, max: 1 });
try {
  await migrate(drizzle({ client: pool }), { migrationsFolder: "drizzle" });
  console.log("Migrations applied.");
} finally {
  await pool.end();
}
