import { createDbClient } from "../../../packages/shared-db/src/client.js";
import { loadConfig } from "../config.js";

const config = loadConfig();
const { db, pool } = createDbClient(config.DATABASE_URL);

export { db, pool };
