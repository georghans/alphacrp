import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const drizzleOrm = require("drizzle-orm") as typeof import("drizzle-orm");
const drizzleNode = require("drizzle-orm/node-postgres") as typeof import("drizzle-orm/node-postgres");
const pgCore = require("drizzle-orm/pg-core") as typeof import("drizzle-orm/pg-core");
const pg = require("pg") as typeof import("pg");

const api = {
  and: drizzleOrm.and,
  eq: drizzleOrm.eq,
  exists: drizzleOrm.exists,
  inArray: drizzleOrm.inArray,
  isNotNull: drizzleOrm.isNotNull,
  isNull: drizzleOrm.isNull,
  drizzle: drizzleNode.drizzle,
  Pool: pg.Pool,
  pgTable: pgCore.pgTable,
  text: pgCore.text,
  uuid: pgCore.uuid,
  numeric: pgCore.numeric,
  timestamp: pgCore.timestamp,
  integer: pgCore.integer,
  boolean: pgCore.boolean,
  jsonb: pgCore.jsonb,
  uniqueIndex: pgCore.uniqueIndex,
  index: pgCore.index
};

export default api;
