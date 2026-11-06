import { mkdirSync } from "node:fs";
import path from "node:path";
import type { NodePgDatabase, NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { seedDatabase } from "./seed";

/**
 * One database type for both drivers. Production (DATABASE_URL set, e.g. Neon on Vercel) uses
 * node-postgres; local development and tests use PGlite, an in-process Postgres that migrates and
 * seeds itself on first use. Both expose the same Drizzle query builder.
 */
export type DB = NodePgDatabase<typeof schema>;

/** Anything that can run queries: the database itself or an open transaction. */
export type Q = PgDatabase<NodePgQueryResultHKT, typeof schema>;

export const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");

type Holder = { promise?: Promise<DB> };
const globalHolder = globalThis as unknown as { __mth263Db?: Holder };

/** Lazily creates one shared connection per server process (survives dev hot reloads). */
export function getDb(): Promise<DB> {
  const holder = (globalHolder.__mth263Db ??= {});
  if (!holder.promise) {
    holder.promise = createDb().catch((err: unknown) => {
      holder.promise = undefined;
      throw err;
    });
  }
  return holder.promise;
}

async function createDb(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const pool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10_000 });
    return drizzle({ client: pool, schema });
  }
  if (process.env.VERCEL) {
    // Vercel's disk is read-only, so the local PGlite fallback can't work there.
    throw new Error("DATABASE_URL is not set: connect the Neon database to this Vercel project (Storage), then redeploy.");
  }
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  return createPgliteDb(dir === "memory" ? null : dir);
}

/** PGlite database, migrated and seeded. Pass null for an in-memory database (tests). */
export async function createPgliteDb(dir: string | null): Promise<DB> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  if (dir) mkdirSync(dir, { recursive: true });
  const client = dir ? new PGlite(dir) : new PGlite();
  await client.waitReady;
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  const shared = db as unknown as DB;
  await seedDatabase(shared);
  return shared;
}
