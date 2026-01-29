import drizzleApi from "../../../../packages/shared-db/src/drizzle.ts";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../../../packages/shared-db/src/schema.ts";

const resolvedDrizzle =
  (drizzleApi as typeof drizzleApi & { default?: typeof drizzleApi }).default ??
  drizzleApi;
const { and, eq } = resolvedDrizzle;
const resolvedSchema =
  (schema as typeof schema & { default?: typeof schema }).default ?? schema;
const { discoveredOffers } = resolvedSchema;

export type DiscoveredOfferInput = {
  searchId: string;
  source?: string;
  externalId?: string | null;
  searchTerm: string;
  url: string;
  rawMetadata?: Record<string, unknown>;
};

export async function upsertDiscoveredOffer(
  db: NodePgDatabase,
  offer: DiscoveredOfferInput
): Promise<{ id: string; isNew: boolean }> {
  const rows = await db
    .insert(discoveredOffers)
    .values({
      searchId: offer.searchId,
      source: offer.source ?? "sellpy",
      externalId: offer.externalId ?? null,
      searchTerm: offer.searchTerm,
      url: offer.url,
      rawMetadata: offer.rawMetadata ?? {}
    })
    .onConflictDoNothing({
      target: [discoveredOffers.source, discoveredOffers.url, discoveredOffers.searchId]
    })
    .returning({ id: discoveredOffers.id });

  if (rows.length > 0) {
    return { id: rows[0].id, isNew: true };
  }

  const existing = await db
    .select({ id: discoveredOffers.id })
    .from(discoveredOffers)
    .where(
      and(
        eq(discoveredOffers.source, offer.source ?? "sellpy"),
        eq(discoveredOffers.url, offer.url),
        eq(discoveredOffers.searchId, offer.searchId)
      )
    )
    .limit(1);

  return { id: existing[0].id, isNew: false };
}
