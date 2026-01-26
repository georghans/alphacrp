import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "./client";
import {
  offers,
  offerImages,
  offerSearchEvaluations,
  searches
} from "./schema";

export async function listMatchingOffers(searchId?: string | string[]) {
  const db = getDb();
  const conditions = [eq(offerSearchEvaluations.decision, "MATCH")];
  const searchIds = Array.isArray(searchId) ? searchId : searchId ? [searchId] : [];
  if (searchIds.length) {
    conditions.push(inArray(offers.searchId, searchIds));
  }

  const rows = await db
    .select({
      offer: offers,
      image: offerImages,
      search: searches,
      evaluation: offerSearchEvaluations
    })
    .from(offers)
    .innerJoin(offerSearchEvaluations, eq(offerSearchEvaluations.offerId, offers.id))
    .leftJoin(
      offerImages,
      and(eq(offerImages.offerId, offers.id), eq(offerImages.position, 0))
    )
    .innerJoin(searches, eq(searches.id, offers.searchId))
    .where(and(...conditions))
    .orderBy(desc(offerSearchEvaluations.evaluatedAt));

  return rows.map((row) => ({
    id: row.offer.id,
    title: row.offer.title ?? "Untitled",
    url: row.offer.url,
    imageUrl: row.image?.imageUrlFull ?? row.image?.imageUrl ?? row.image?.imageUrlThumb ?? null,
    searchId: row.search.id,
    searchTitle: row.search.title,
    evaluatedAt: row.evaluation.evaluatedAt
  }));
}

export async function listOffers(searchId?: string, limit = 100) {
  const db = getDb();
  const conditions = [];
  if (searchId) {
    conditions.push(eq(offers.searchId, searchId));
  }

  const rows = await db
    .select({
      offer: offers,
      image: offerImages,
      search: searches
    })
    .from(offers)
    .leftJoin(
      offerImages,
      and(eq(offerImages.offerId, offers.id), eq(offerImages.position, 0))
    )
    .innerJoin(searches, eq(searches.id, offers.searchId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(offers.scrapedAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.offer.id,
    title: row.offer.title ?? "Untitled",
    url: row.offer.url,
    imageData: row.image?.imageData ?? null,
    imageMime: row.image?.imageMime ?? null,
    imageUrl: row.image?.imageUrlFull ?? row.image?.imageUrl ?? row.image?.imageUrlThumb ?? null,
    searchTitle: row.search.title,
    searchId: row.search.id,
    scrapedAt: row.offer.scrapedAt
  }));
}
