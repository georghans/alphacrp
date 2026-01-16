import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as unknown as {
  db?: ReturnType<typeof drizzle>;
  pool?: Pool;
  envLoaded?: boolean;
};

function initDb() {
  if (!globalForDb.envLoaded) {
    const localEnv = resolve(process.cwd(), ".env");
    const repoEnv = resolve(process.cwd(), "../../.env");
    if (existsSync(localEnv)) {
      loadEnv({ path: localEnv });
    } else if (existsSync(repoEnv)) {
      loadEnv({ path: repoEnv });
    }
    globalForDb.envLoaded = true;
  }

  if (globalForDb.db && globalForDb.pool) return;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  if (databaseUrl.startsWith("sqlite:")) {
    throw new Error("DATABASE_URL must point to PostgreSQL, not sqlite");
  }
  const pool = new Pool({ connectionString: databaseUrl });
  globalForDb.pool = pool;
  globalForDb.db = drizzle(pool);
}

export function getDb() {
  initDb();
  return globalForDb.db!;
}

export function getPool() {
  initDb();
  return globalForDb.pool!;
}
