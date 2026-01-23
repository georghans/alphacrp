import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const drizzleOrm = require("drizzle-orm") as typeof import("drizzle-orm");
const drizzleNode = require("drizzle-orm/node-postgres") as typeof import("drizzle-orm/node-postgres");
const pg = require("pg") as typeof import("pg");

const api = {
  and: drizzleOrm.and,
  eq: drizzleOrm.eq,
  exists: drizzleOrm.exists,
  inArray: drizzleOrm.inArray,
  isNotNull: drizzleOrm.isNotNull,
  isNull: drizzleOrm.isNull,
  drizzle: drizzleNode.drizzle,
  Pool: pg.Pool
};

export default api;
