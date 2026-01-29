import drizzleApi from "../../../../packages/shared-db/src/drizzle.ts";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../../../packages/shared-db/src/schema.ts";

const resolvedDrizzle =
  (drizzleApi as typeof drizzleApi & { default?: typeof drizzleApi }).default ??
  drizzleApi;
const { and, eq, inArray } = resolvedDrizzle;
const resolvedSchema =
  (schema as typeof schema & { default?: typeof schema }).default ?? schema;
const { discoveredOffers } = resolvedSchema;

const MAX_RETRIES = 3;

export type DiscoveredOfferRow = {
  id: string;
  searchId: string;
  source: string;
  externalId: string | null;
  searchTerm: string;
  url: string;
  rawMetadata: Record<string, unknown>;
};

export async function claimPendingOffers(
  db: NodePgDatabase,
  limit: number
): Promise<DiscoveredOfferRow[]> {
  const pending = await db
    .select({
      id: discoveredOffers.id,
      searchId: discoveredOffers.searchId,
      source: discoveredOffers.source,
      externalId: discoveredOffers.externalId,
      searchTerm: discoveredOffers.searchTerm,
      url: discoveredOffers.url,
      rawMetadata: discoveredOffers.rawMetadata
    })
    .from(discoveredOffers)
    .where(eq(discoveredOffers.status, "pending"))
    .limit(limit);

  if (pending.length === 0) return [];

  const ids = pending.map((r) => r.id);
  await db
    .update(discoveredOffers)
    .set({ status: "in_progress" })
    .where(inArray(discoveredOffers.id, ids));

  return pending as DiscoveredOfferRow[];
}

export async function markScraped(
  db: NodePgDatabase,
  id: string
): Promise<void> {
  await db
    .update(discoveredOffers)
    .set({ status: "scraped", scrapedAt: new Date() })
    .where(eq(discoveredOffers.id, id));
}

export async function markFailed(
  db: NodePgDatabase,
  id: string,
  errorMessage: string
): Promise<void> {
  const rows = await db
    .select({ retryCount: discoveredOffers.retryCount })
    .from(discoveredOffers)
    .where(eq(discoveredOffers.id, id))
    .limit(1);

  const currentRetries = rows[0]?.retryCount ?? 0;
  const nextRetry = currentRetries + 1;
  const nextStatus = nextRetry >= MAX_RETRIES ? "failed" : "pending";

  await db
    .update(discoveredOffers)
    .set({
      status: nextStatus,
      errorMessage,
      retryCount: nextRetry
    })
    .where(eq(discoveredOffers.id, id));
}
