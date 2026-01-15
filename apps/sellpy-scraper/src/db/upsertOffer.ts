import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { offers, offerImages } from "../../../packages/shared-db/src/schema.js";

export type OfferRecord = {
  source: string;
  externalId: string;
  searchTerm: string;
  url: string;
  title?: string | null;
  description?: string | null;
  priceAmount?: number | null;
  priceCurrency?: string | null;
  brand?: string | null;
  category?: string | null;
  subcategory?: string | null;
  condition?: string | null;
  size?: string | null;
  color?: string | null;
  material?: string | null;
  availability?: string | null;
  createdAtSource?: Date | null;
  rawMetadata: Record<string, unknown>;
};

export type ImageRecord = {
  position: number;
  imageUrl: string;
  imageUrlFull?: string | null;
  imageUrlThumb?: string | null;
};

export async function upsertOffer(
  db: NodePgDatabase,
  offer: OfferRecord,
  images: ImageRecord[]
): Promise<{ offerId: string; isNew: boolean }> {
  const existing = await db
    .select({ id: offers.id })
    .from(offers)
    .where(and(eq(offers.source, offer.source), eq(offers.externalId, offer.externalId)))
    .limit(1);

  const offerId = existing[0]?.id ?? randomUUID();

  await db
    .insert(offers)
    .values({
      id: offerId,
      source: offer.source,
      externalId: offer.externalId,
      searchTerm: offer.searchTerm,
      url: offer.url,
      title: offer.title ?? null,
      description: offer.description ?? null,
      priceAmount: offer.priceAmount ?? null,
      priceCurrency: offer.priceCurrency ?? null,
      brand: offer.brand ?? null,
      category: offer.category ?? null,
      subcategory: offer.subcategory ?? null,
      condition: offer.condition ?? null,
      size: offer.size ?? null,
      color: offer.color ?? null,
      material: offer.material ?? null,
      availability: offer.availability ?? null,
      createdAtSource: offer.createdAtSource ?? null,
      rawMetadata: offer.rawMetadata ?? {},
      scrapedAt: new Date()
    })
    .onConflictDoUpdate({
      target: [offers.source, offers.externalId],
      set: {
        searchTerm: offer.searchTerm,
        url: offer.url,
        title: offer.title ?? null,
        description: offer.description ?? null,
        priceAmount: offer.priceAmount ?? null,
        priceCurrency: offer.priceCurrency ?? null,
        brand: offer.brand ?? null,
        category: offer.category ?? null,
        subcategory: offer.subcategory ?? null,
        condition: offer.condition ?? null,
        size: offer.size ?? null,
        color: offer.color ?? null,
        material: offer.material ?? null,
        availability: offer.availability ?? null,
        createdAtSource: offer.createdAtSource ?? null,
        rawMetadata: offer.rawMetadata ?? {},
        scrapedAt: new Date()
      }
    });

  await db.delete(offerImages).where(eq(offerImages.offerId, offerId));
  if (images.length > 0) {
    await db.insert(offerImages).values(
      images.map((img) => ({
        id: randomUUID(),
        offerId,
        position: img.position,
        imageUrl: img.imageUrl,
        imageUrlFull: img.imageUrlFull ?? null,
        imageUrlThumb: img.imageUrlThumb ?? null,
        createdAt: new Date()
      }))
    );
  }

  const isNew = existing.length === 0;
  return { offerId, isNew };
}
