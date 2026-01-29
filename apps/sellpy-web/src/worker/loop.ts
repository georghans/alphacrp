import pLimit from "p-limit";
import { createRequire } from "node:module";
import { loadConfig as loadScraperConfig } from "../../../../apps/sellpy-scraper/src/config";
import { createHttpClient } from "../../../../apps/sellpy-scraper/src/utils/http";
import { crawlSearch } from "../../../../apps/sellpy-scraper/src/crawler/searchCrawler";
import { crawlOffer } from "../../../../apps/sellpy-scraper/src/crawler/offerCrawler";
import { upsertOffer } from "../../../../apps/sellpy-scraper/src/db/upsertOffer";
import { upsertDiscoveredOffer } from "../../../../apps/sellpy-scraper/src/db/upsertDiscoveredOffer";
import {
  claimPendingOffers,
  markScraped,
  markFailed
} from "../../../../apps/sellpy-scraper/src/db/discoveredOfferQueue";
import { loadConfig as loadMatcherConfig } from "../../../../apps/style-scoring-bot/src/config";
import { OpenRouterClient } from "../../../../apps/style-scoring-bot/src/evaluator/openrouterClient";
import { runEvaluation } from "../../../../apps/style-scoring-bot/src/queue/worker";

const requireFromSchema = createRequire(
  new URL("../../../../packages/shared-db/src/schema.ts", import.meta.url)
);
const { drizzle } = requireFromSchema(
  "drizzle-orm/node-postgres"
) as typeof import("drizzle-orm/node-postgres");
const { Pool } = requireFromSchema("pg") as typeof import("pg");

function createDbClient(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);
  return { db, pool };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry).trim()).filter(Boolean);
}

type SearchRow = {
  id: string;
  title: string;
  search_terms: unknown;
  search_prompt: string;
  example_images: unknown;
  is_active: boolean;
  is_deleted: boolean;
  created_at?: Date | string | null;
  updated_at?: Date | string | null;
};

function normalizeSearchRow(row: SearchRow) {
  return {
    id: row.id,
    title: row.title,
    searchTerms: row.search_terms ?? [],
    searchPrompt: row.search_prompt ?? "",
    exampleImages: row.example_images ?? [],
    isActive: row.is_active,
    isDeleted: row.is_deleted,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null
  };
}

async function listActiveSearches(pool: InstanceType<typeof Pool>) {
  const result = await pool.query<SearchRow>(
    "select * from searches where is_active = true and is_deleted = false"
  );
  return result.rows.map(normalizeSearchRow);
}

async function runDiscoveryLoop() {
  const config = loadScraperConfig();
  const { db, pool } = createDbClient(config.databaseUrl);
  const http = createHttpClient({
    userAgent: config.userAgent,
    rateLimitRps: config.rateLimitRps
  });

  const pollMs = Number(process.env.SCRAPER_POLL_MS ?? 120000);
  const maxPages = Number(process.env.SCRAPER_MAX_PAGES ?? config.maxPages);
  const maxItems = Number(process.env.SCRAPER_MAX_ITEMS ?? config.maxItems);

  while (true) {
    const activeSearches = await listActiveSearches(pool);

    for (const search of activeSearches) {
      const terms = parseStringArray(search.searchTerms);
      if (terms.length === 0) continue;

      for (const term of terms) {
        try {
          const discovered = await crawlSearch(http, config, term, maxPages, maxItems);

          for (const offer of discovered) {
            await upsertDiscoveredOffer(db, {
              searchId: search.id,
              source: "sellpy",
              externalId: offer.nativeExternalId ?? null,
              searchTerm: term,
              url: offer.url,
              rawMetadata: (offer.metadata as Record<string, unknown>) ?? {}
            });
          }

          console.log(`Discovery: ${discovered.length} offers found for "${term}" (search ${search.id})`);
        } catch (error) {
          console.error("Discovery loop error", { term, searchId: search.id, error });
        }
      }
    }

    await sleep(pollMs);
  }
}

async function runOfferScraperLoop() {
  const config = loadScraperConfig();
  const { db, pool } = createDbClient(config.databaseUrl);
  const http = createHttpClient({
    userAgent: config.userAgent,
    rateLimitRps: config.rateLimitRps
  });

  const pollMs = Number(process.env.OFFER_SCRAPER_POLL_MS ?? 60000);
  const batchSize = Number(process.env.OFFER_SCRAPER_BATCH_SIZE ?? 20);

  while (true) {
    try {
      const claimed = await claimPendingOffers(db, batchSize);

      if (claimed.length > 0) {
        console.log(`Offer scraper: claimed ${claimed.length} pending offers`);
        const limit = pLimit(config.concurrency);

        await Promise.all(
          claimed.map((row) =>
            limit(async () => {
              try {
                const { offer: details, images } = await crawlOffer(
                  http,
                  config,
                  row.searchTerm,
                  row.url,
                  row.externalId ?? undefined
                );

                await upsertOffer(
                  db,
                  {
                    ...details,
                    searchId: row.searchId
                  },
                  images
                );

                await markScraped(db, row.id);
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                await markFailed(db, row.id, message);
                console.error("Offer scraper error", { url: row.url, error });
              }
            })
          )
        );
      }
    } catch (error) {
      console.error("Offer scraper loop error", error);
    }

    await sleep(pollMs);
  }
}

async function runMatcherLoop() {
  const config = loadMatcherConfig();
  const { db, pool } = createDbClient(config.DATABASE_URL);
  const client = new OpenRouterClient(config);

  const pollMs = Number(process.env.MATCHER_POLL_MS ?? 180000);
  const batchSize = Number(process.env.MATCHER_BATCH_SIZE ?? 50);
  const minScoreToMatch = Number(process.env.MATCHER_MIN_SCORE ?? 0.7);
  const strictnessRaw = (process.env.MATCHER_STRICTNESS ?? "medium").toLowerCase();
  const strictness = strictnessRaw === "low" || strictnessRaw === "high" ? strictnessRaw : "medium";
  const concurrency = Number(process.env.MATCHER_CONCURRENCY ?? config.OPENROUTER_CONCURRENCY);

  while (true) {
    const activeSearches = await listActiveSearches(pool);

    for (const search of activeSearches) {
      const exampleImages = parseStringArray(search.exampleImages);
      if (!search.searchPrompt || exampleImages.length === 0) continue;

      try {
        await runEvaluation(client, {
          searchId: search.id,
          batchSize,
          concurrency,
          minScoreToMatch,
          strictness,
          dryRun: false,
          force: false
        });
      } catch (error) {
        console.error("Matcher loop error", { searchId: search.id, error });
      }
    }

    await sleep(pollMs);
  }
}

async function main() {
  await Promise.all([runDiscoveryLoop(), runOfferScraperLoop(), runMatcherLoop()]);
}

main().catch((error) => {
  console.error("Worker failed", error);
  process.exit(1);
});
