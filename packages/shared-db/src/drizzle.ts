import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const drizzleOrm = require("drizzle-orm") as typeof import("drizzle-orm");
const drizzleNode = require("drizzle-orm/node-postgres") as typeof import("drizzle-orm/node-postgres");
const pg = require("pg") as typeof import("pg");

export const { and, eq, exists, inArray, isNotNull, isNull } = drizzleOrm;
export const { drizzle } = drizzleNode;
export const { Pool } = pg;
