import { load } from "cheerio";

export type OfferDetails = {
  externalId?: string;
  title?: string | null;
  description?: string | null;
  priceAmount?: string | null;
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
  imageUrls?: string[];
  rawMetadata: Record<string, unknown>;
};

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractJsonLd(html: string): unknown[] {
  const $ = load(html);
  const out: unknown[] = [];
  $("script[type='application/ld+json']").each((_, el) => {
    const json = $(el).text().trim();
    if (!json) return;
    const parsed = tryParseJson(json);
    if (parsed) {
      out.push(parsed);
    }
  });
  return out;
}

function deepFindOffer(obj: unknown): Record<string, unknown> | null {
  const stack: unknown[] = [obj];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const item of current) stack.push(item);
      continue;
    }

    const record = current as Record<string, unknown>;
    const keys = Object.keys(record);
    const hasTitle = keys.includes("title") || keys.includes("name");
    const hasPrice = keys.includes("price") || keys.includes("priceAmount");
    const hasImages = keys.includes("images") || keys.includes("image") || keys.includes("imageUrls");
    if (hasTitle && (hasPrice || hasImages)) {
      return record;
    }

    for (const value of Object.values(record)) {
      if (value && typeof value === "object") {
        stack.push(value);
      }
    }
  }
  return null;
}

function coerceString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  return null;
}

export function extractOfferDetails(html: string): OfferDetails {
  const $ = load(html);
  const nextDataRaw = $("#__NEXT_DATA__").text();
  const nextData = nextDataRaw ? tryParseJson(nextDataRaw) : null;

  const jsonLd = extractJsonLd(html);
  let details: OfferDetails = { rawMetadata: {} };

  for (const entry of jsonLd) {
    if (entry && typeof entry === "object") {
      const record = entry as Record<string, unknown>;
      const isProduct =
        record["@type"] === "Product" ||
        (Array.isArray(record["@type"]) && (record["@type"] as unknown[]).includes("Product"));
      if (!isProduct) continue;

      details = {
        ...details,
        title: coerceString(record.name),
        description: coerceString(record.description),
        brand:
          typeof record.brand === "string"
            ? record.brand
            : coerceString((record.brand as Record<string, unknown> | undefined)?.name),
        category: coerceString(record.category),
        imageUrls: Array.isArray(record.image)
          ? (record.image as string[])
          : record.image
            ? [String(record.image)]
            : undefined,
        externalId: coerceString(record.sku) ?? coerceString(record.productID)
      };

      const offers = record.offers as Record<string, unknown> | undefined;
      if (offers) {
        details.priceAmount = coerceString(offers.price);
        details.priceCurrency = coerceString(offers.priceCurrency);
        details.availability = coerceString(offers.availability);
      }

      details.rawMetadata = { ...details.rawMetadata, jsonLd: record };
    }
  }

  if (nextData) {
    const offerObject = deepFindOffer(nextData);
    if (offerObject) {
      const images = offerObject.images ?? offerObject.image ?? offerObject.imageUrls;
      const imageUrls = Array.isArray(images)
        ? images.map((img) => String(img))
        : images
          ? [String(images)]
          : undefined;

      details = {
        ...details,
        externalId: details.externalId ?? coerceString(offerObject.id ?? offerObject.externalId),
        title: details.title ?? coerceString(offerObject.title ?? offerObject.name),
        description: details.description ?? coerceString(offerObject.description),
        priceAmount: details.priceAmount ?? coerceString(offerObject.price ?? offerObject.priceAmount),
        priceCurrency:
          details.priceCurrency ??
          coerceString(offerObject.currency ?? offerObject.priceCurrency),
        brand: details.brand ?? coerceString(offerObject.brand),
        category: details.category ?? coerceString(offerObject.category),
        subcategory: details.subcategory ?? coerceString(offerObject.subcategory),
        condition: details.condition ?? coerceString(offerObject.condition),
        size: details.size ?? coerceString(offerObject.size),
        color: details.color ?? coerceString(offerObject.color),
        material: details.material ?? coerceString(offerObject.material),
        availability: details.availability ?? coerceString(offerObject.availability),
        imageUrls: details.imageUrls ?? imageUrls,
        rawMetadata: { ...details.rawMetadata, nextData: nextData }
      };
    } else {
      details.rawMetadata = { ...details.rawMetadata, nextData };
    }
  }

  return details;
}
