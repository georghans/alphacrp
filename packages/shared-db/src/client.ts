import drizzleApi from "./drizzle.js";

const { drizzle, Pool } = drizzleApi;

export function createDbClient(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);
  return { db, pool };
}
