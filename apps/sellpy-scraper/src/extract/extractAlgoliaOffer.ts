import type { OfferDetails, ImageRecord } from "../db/upsertOffer.js";

type AlgoliaHit = Record<string, unknown>;

function str(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number") return String(value);
  return null;
}

function arrJoin(value: unknown): string | null {
  if (Array.isArray(value)) {
    const joined = value.map(String).filter(Boolean).join(", ");
    return joined || null;
  }
  return str(value);
}

function getNestedField(hit: AlgoliaHit, ...keys: string[]): unknown {
  let current: unknown = hit;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function buildTitle(hit: AlgoliaHit): string | null {
  const titleOutputOrder = hit.titleOutputOrder;
  const metadata = hit.metadata as Record<string, unknown> | undefined;

  if (Array.isArray(titleOutputOrder) && metadata) {
    const parts: string[] = [];
    for (const key of titleOutputOrder) {
      const val = metadata[String(key)];
      if (val != null && val !== "") {
        parts.push(String(val));
      }
    }
    if (parts.length > 0) return parts.join(", ");
  }

  // Fallback: use metadata fields directly
  if (metadata) {
    const parts = [
      str(metadata.category),
      str(metadata.type),
      str(metadata.brand),
      str(metadata.size)
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
  }

  return str(hit.title) ?? str(hit.name) ?? null;
}

function buildDescription(hit: AlgoliaHit): string | null {
  const metadata = hit.metadata as Record<string, unknown> | undefined;
  if (!metadata) return null;

  const lines: string[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    if (value == null || value === "") continue;
    const display = Array.isArray(value) ? value.join(", ") : String(value);
    lines.push(`${key}: ${display}`);
  }
  return lines.length > 0 ? lines.join("\n") : null;
}

function extractPrice(hit: AlgoliaHit): { amount: number | null; currency: string | null } {
  // Try price_DE first (cents), then pricing
  const priceDe = hit.price_DE as Record<string, unknown> | undefined;
  if (priceDe && typeof priceDe.amount === "number") {
    return {
      amount: priceDe.amount / 100,
      currency: str(priceDe.currency) ?? "EUR"
    };
  }

  // Try other price_XX fields
  for (const key of Object.keys(hit)) {
    if (!key.startsWith("price_")) continue;
    const priceObj = hit[key] as Record<string, unknown> | undefined;
    if (priceObj && typeof priceObj.amount === "number") {
      return {
        amount: priceObj.amount / 100,
        currency: str(priceObj.currency) ?? null
      };
    }
  }

  const pricing = hit.pricing as Record<string, unknown> | undefined;
  if (pricing && typeof pricing.amount === "number") {
    return {
      amount: pricing.amount,
      currency: str(pricing.currency) ?? null
    };
  }

  return { amount: null, currency: null };
}

function extractCategory(hit: AlgoliaHit): { category: string | null; subcategory: string | null } {
  const categories = hit.categories as Record<string, unknown> | undefined;
  const lvl2 = categories?.lvl2;

  if (Array.isArray(lvl2) && lvl2.length > 0) {
    const parts = String(lvl2[0]).split(" > ");
    return {
      category: parts[1] ?? parts[0] ?? null,
      subcategory: parts[2] ?? null
    };
  }

  const lvl1 = categories?.lvl1;
  if (Array.isArray(lvl1) && lvl1.length > 0) {
    const parts = String(lvl1[0]).split(" > ");
    return {
      category: parts[1] ?? parts[0] ?? null,
      subcategory: null
    };
  }

  const metadata = hit.metadata as Record<string, unknown> | undefined;
  return {
    category: str(metadata?.category) ?? null,
    subcategory: str(metadata?.subcategory) ?? null
  };
}

function extractImages(hit: AlgoliaHit): ImageRecord[] {
  const images = hit.images;
  if (!Array.isArray(images)) return [];

  const result: ImageRecord[] = [];
  for (const img of images) {
    if (img == null) continue;
    const url = typeof img === "string" ? img : str((img as Record<string, unknown>).url);
    if (!url) continue;
    result.push({
      position: result.length,
      imageUrl: url,
      imageData: null,
      imageMime: null
    });
  }
  return result;
}

/**
 * Check whether a rawMetadata object looks like a Sellpy Algolia hit.
 */
export function isAlgoliaHit(rawMetadata: unknown): rawMetadata is Record<string, unknown> {
  if (!rawMetadata || typeof rawMetadata !== "object") return false;
  const hit = rawMetadata as Record<string, unknown>;
  return (
    typeof hit.objectID === "string" &&
    (hit.metadata != null || hit.pricing != null || hit.images != null)
  );
}

/**
 * Extract offer details and images from an Algolia hit stored in rawMetadata.
 * Returns null if the hit doesn't contain enough data.
 */
export function extractAlgoliaOffer(
  rawMetadata: Record<string, unknown>,
  searchTerm: string,
  url: string,
  externalId?: string
): { offer: OfferDetails; images: ImageRecord[] } | null {
  if (!isAlgoliaHit(rawMetadata)) return null;

  const hit = rawMetadata;
  const metadata = hit.metadata as Record<string, unknown> | undefined;
  const price = extractPrice(hit);
  const { category, subcategory } = extractCategory(hit);
  const images = extractImages(hit);

  const createdAtRaw = hit.createdAt;
  let createdAtSource: Date | null = null;
  if (typeof createdAtRaw === "number") {
    createdAtSource = new Date(createdAtRaw * 1000);
  } else if (typeof createdAtRaw === "string") {
    const parsed = new Date(createdAtRaw);
    if (!Number.isNaN(parsed.getTime())) createdAtSource = parsed;
  }

  const offer: OfferDetails = {
    source: "sellpy",
    externalId: externalId ?? str(hit.objectID) ?? "",
    searchTerm,
    url,
    title: buildTitle(hit),
    description: buildDescription(hit),
    priceAmount: price.amount,
    priceCurrency: price.currency,
    brand: str(metadata?.brand) ?? null,
    category,
    subcategory,
    condition: str(metadata?.condition) ?? null,
    size: str(metadata?.size) ?? null,
    color: arrJoin(metadata?.color),
    material: arrJoin(metadata?.material),
    availability: hit.isForSale === true ? "in_stock" : hit.isForSale === false ? "out_of_stock" : null,
    createdAtSource,
    rawMetadata
  };

  return { offer, images };
}
