import { drizzle, Pool } from "./drizzle.js";

export function createDbClient(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);
  return { db, pool };
}
