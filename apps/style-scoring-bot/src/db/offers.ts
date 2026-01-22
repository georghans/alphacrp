import { and, eq, exists, inArray, isNotNull, isNull } from "../../../../packages/shared-db/src/drizzle.ts";
import { db } from "./client.js";
import * as schema from "../../../../packages/shared-db/src/schema.ts";

const { offers, offerImages, offerSearchEvaluations } = schema;

function mapOfferRows(rows: Array<{ offer: typeof offers.$inferSelect; image: typeof offerImages.$inferSelect }>) {
  const byId = new Map<string, typeof offers.$inferSelect & { images: typeof offerImages.$inferSelect[] }>();

  for (const row of rows) {
    const existing = byId.get(row.offer.id);
    if (existing) {
      existing.images.push(row.image);
      continue;
    }
    byId.set(row.offer.id, { ...row.offer, images: [row.image] });
  }

  return Array.from(byId.values()).map((offer) => ({
    ...offer,
    images: offer.images.sort((a, b) => a.position - b.position)
  }));
}

export async function fetchOffersForSearch(
  searchId: string,
  batchSize: number,
  force: boolean
) {
  const offersWithImages = exists(
    db
      .select()
      .from(offerImages)
      .where(eq(offerImages.offerId, offers.id))
  );

  const conditions = [isNotNull(offers.title), offersWithImages, eq(offers.searchId, searchId)];
  if (!force) {
    conditions.push(isNull(offerSearchEvaluations.id));
  }
  const baseWhere = and(...conditions);

  const offerRows = await db
    .select({ id: offers.id })
    .from(offers)
    .leftJoin(
      offerSearchEvaluations,
      and(
        eq(offerSearchEvaluations.offerId, offers.id),
        eq(offerSearchEvaluations.searchId, searchId)
      )
    )
    .where(baseWhere)
    .limit(batchSize);

  const offerIds = offerRows.map((row) => row.id);
  if (offerIds.length === 0) return [];

  const rows = await db
    .select({ offer: offers, image: offerImages })
    .from(offers)
    .innerJoin(offerImages, eq(offerImages.offerId, offers.id))
    .where(inArray(offers.id, offerIds))
    .orderBy(offers.id, offerImages.position);

  return mapOfferRows(rows);
}

export async function fetchOfferById(offerId: string) {
  const rows = await db
    .select({ offer: offers, image: offerImages })
    .from(offers)
    .innerJoin(offerImages, eq(offerImages.offerId, offers.id))
    .where(eq(offers.id, offerId))
    .orderBy(offerImages.position);

  const offersWithImages = mapOfferRows(rows);
  return offersWithImages[0] ?? null;
}
