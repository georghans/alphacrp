import { randomUUID } from "node:crypto";

import { getDb, getPool } from "@/db/client";
import {
  offerImages,
  offerSearchEvaluations,
  offers,
  searches
} from "@/db/schema";

const now = new Date();
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

type SeedSearch = {
  id: string;
  title: string;
  prompt: string;
  searchTerms: string[];
  images: string[];
  isActive: boolean;
};

type SeedOffer = {
  id: string;
  searchId: string;
  title: string;
  url: string;
  imageUrl: string;
  decision: "MATCH" | "NO_MATCH";
};

const seedSearches: SeedSearch[] = [
  {
    id: randomUUID(),
    title: "Test Match: 90s Grunge",
    prompt: "90s grunge with oversized knits, dark denim, and distressed textures.",
    searchTerms: ["grunge", "vintage knit", "oversized"],
    images: ["https://picsum.photos/seed/grunge/600/400"],
    isActive: true
  },
  {
    id: randomUUID(),
    title: "Test Match: Minimalist Tailoring",
    prompt: "Minimalist silhouettes with clean lines, neutral palettes, and sharp tailoring.",
    searchTerms: ["minimal", "tailored blazer", "neutral"],
    images: ["https://picsum.photos/seed/minimal/600/400"],
    isActive: true
  },
  {
    id: randomUUID(),
    title: "Test Match: Cozy Layering",
    prompt: "Soft, layered knits and cozy textures for relaxed outfits.",
    searchTerms: ["cozy", "layering", "wool"],
    images: ["https://picsum.photos/seed/cozy/600/400"],
    isActive: false
  }
];

const seedOffers: SeedOffer[] = [
  {
    id: randomUUID(),
    searchId: seedSearches[0].id,
    title: "Distressed Knit Cardigan",
    url: "https://example.com/offer/grunge-cardigan",
    imageUrl: "https://picsum.photos/seed/grunge-offer-1/800/600",
    decision: "MATCH"
  },
  {
    id: randomUUID(),
    searchId: seedSearches[0].id,
    title: "Vintage Band Tee",
    url: "https://example.com/offer/grunge-tee",
    imageUrl: "https://picsum.photos/seed/grunge-offer-2/800/600",
    decision: "MATCH"
  },
  {
    id: randomUUID(),
    searchId: seedSearches[1].id,
    title: "Structured Beige Blazer",
    url: "https://example.com/offer/minimal-blazer",
    imageUrl: "https://picsum.photos/seed/minimal-offer-1/800/600",
    decision: "MATCH"
  },
  {
    id: randomUUID(),
    searchId: seedSearches[1].id,
    title: "Straight-Leg Wool Trousers",
    url: "https://example.com/offer/minimal-trousers",
    imageUrl: "https://picsum.photos/seed/minimal-offer-2/800/600",
    decision: "MATCH"
  },
  {
    id: randomUUID(),
    searchId: seedSearches[2].id,
    title: "Chunky Cable Knit Sweater",
    url: "https://example.com/offer/cozy-knit",
    imageUrl: "https://picsum.photos/seed/cozy-offer-1/800/600",
    decision: "MATCH"
  },
  {
    id: randomUUID(),
    searchId: seedSearches[2].id,
    title: "Soft Wool Scarf",
    url: "https://example.com/offer/cozy-scarf",
    imageUrl: "https://picsum.photos/seed/cozy-offer-2/800/600",
    decision: "NO_MATCH"
  }
];

async function seed() {
  const db = getDb();

  await db.insert(searches).values(
    seedSearches.map((search) => ({
      id: search.id,
      title: search.title,
      searchTerms: search.searchTerms,
      searchPrompt: search.prompt,
      exampleImages: search.images,
      isActive: search.isActive,
      isDeleted: false,
      createdAt: twoDaysAgo,
      updatedAt: now
    }))
  );

  await db.insert(offers).values(
    seedOffers.map((offer, index) => ({
      id: offer.id,
      searchId: offer.searchId,
      source: "seed",
      externalId: `seed-${index + 1}`,
      searchTerm: "seed",
      url: offer.url,
      title: offer.title,
      description: "Seeded offer for matches page testing.",
      priceAmount: "49.99",
      priceCurrency: "EUR",
      rawMetadata: { seeded: true },
      scrapedAt: now
    }))
  );

  await db.insert(offerImages).values(
    seedOffers.map((offer) => ({
      offerId: offer.id,
      position: 0,
      imageUrl: offer.imageUrl,
      imageUrlFull: offer.imageUrl,
      imageUrlThumb: offer.imageUrl
    }))
  );

  await db.insert(offerSearchEvaluations).values(
    seedOffers.map((offer) => ({
      offerId: offer.id,
      searchId: offer.searchId,
      decision: offer.decision,
      styleScore: offer.decision === "MATCH" ? "0.86" : "0.32",
      confidence: offer.decision === "MATCH" ? "0.79" : "0.41",
      matchReasons: offer.decision === "MATCH" ? ["Seeded match"] : [],
      mismatchReasons: offer.decision === "MATCH" ? [] : ["Seeded mismatch"],
      tags: ["seeded"],
      rawModelOutput: { seeded: true },
      modelName: "seed",
      modelVersion: "0.0"
    }))
  );

  const pool = getPool();
  await pool.end();

  console.log("Seeded searches:");
  for (const search of seedSearches) {
    console.log(`- ${search.title} (${search.id})`);
  }
}

seed().catch((error) => {
  console.error("Seeding failed", error);
  process.exitCode = 1;
});
