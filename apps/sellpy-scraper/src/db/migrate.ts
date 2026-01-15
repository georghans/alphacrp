import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfig } from "../config.js";
import { createDbClient } from "./client.js";
import { logger } from "../utils/logger.js";

async function main() {
  const config = loadConfig();
  const { pool } = createDbClient(config.databaseUrl);

  const sqlPath = resolve("../../packages/shared-db/migrations/001_init.sql");
  const sql = await readFile(sqlPath, "utf8");

  logger.info({ sqlPath }, "Running migration");
  await pool.query(sql);
  await pool.end();
  logger.info("Migration complete");
}

main().catch((error) => {
  logger.error({ error }, "Migration failed");
  process.exit(1);
});
