import * as sharedDb from "../../../../packages/shared-db/src/client.ts";

export const createDbClient =
  (sharedDb as { createDbClient?: typeof sharedDb.createDbClient }).createDbClient ??
  (sharedDb as { default?: { createDbClient?: typeof sharedDb.createDbClient } }).default
    ?.createDbClient;

if (!createDbClient) {
  throw new Error("Failed to load createDbClient from shared-db");
}
