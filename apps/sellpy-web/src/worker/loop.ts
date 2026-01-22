import pLimit from "p-limit";
import { and, eq } from "drizzle-orm";
import * as sharedDb from "../../../../packages/shared-db/src/client";
import { searches } from "../../../../packages/shared-db/src/schema";
import { loadConfig as loadScraperConfig } from "../../../../apps/sellpy-scraper/src/config";
import { createHttpClient } from "../../../../apps/sellpy-scraper/src/utils/http";
import { crawlSearch } from "../../../../apps/sellpy-scraper/src/crawler/searchCrawler";
import { crawlOffer } from "../../../../apps/sellpy-scraper/src/crawler/offerCrawler";
import { upsertOffer } from "../../../../apps/sellpy-scraper/src/db/upsertOffer";
import { loadConfig as loadMatcherConfig } from "../../../../apps/style-scoring-bot/src/config";
import { OpenRouterClient } from "../../../../apps/style-scoring-bot/src/evaluator/openrouterClient";
import { runEvaluation } from "../../../../apps/style-scoring-bot/src/queue/worker";

const createDbClient =
  (sharedDb as { createDbClient?: typeof sharedDb.createDbClient }).createDbClient ??
  (sharedDb as { default?: { createDbClient?: typeof sharedDb.createDbClient } }).default
    ?.createDbClient;

if (!createDbClient) {
  throw new Error("Failed to load createDbClient from shared-db");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry).trim()).filter(Boolean);
}

async function runScraperLoop() {
  const config = loadScraperConfig();
  const { db } = createDbClient(config.databaseUrl);
  const http = createHttpClient({
    userAgent: config.userAgent,
    rateLimitRps: config.rateLimitRps
  });

  const pollMs = Number(process.env.SCRAPER_POLL_MS ?? 120000);
  const maxPages = Number(process.env.SCRAPER_MAX_PAGES ?? config.maxPages);
  const maxItems = Number(process.env.SCRAPER_MAX_ITEMS ?? config.maxItems);

  while (true) {
    const activeSearches = await db
      .select()
      .from(searches)
      .where(and(eq(searches.isActive, true), eq(searches.isDeleted, false)));

    for (const search of activeSearches) {
      const terms = parseStringArray(search.searchTerms);
      if (terms.length === 0) continue;

      for (const term of terms) {
        try {
          const discovered = await crawlSearch(http, config, term, maxPages, maxItems);
          const limit = pLimit(config.concurrency);

          await Promise.all(
            discovered.map((offer) =>
              limit(async () => {
                const { offer: details, images } = await crawlOffer(
                  http,
                  config,
                  term,
                  offer.url,
                  offer.nativeExternalId
                );

                await upsertOffer(
                  db,
                  {
                    ...details,
                    searchId: search.id
                  },
                  images
                );
              })
            )
          );
        } catch (error) {
          console.error("Scraper loop error", { term, searchId: search.id, error });
        }
      }
    }

    await sleep(pollMs);
  }
}

async function runMatcherLoop() {
  const config = loadMatcherConfig();
  const { db } = createDbClient(config.DATABASE_URL);
  const client = new OpenRouterClient(config);

  const pollMs = Number(process.env.MATCHER_POLL_MS ?? 180000);
  const batchSize = Number(process.env.MATCHER_BATCH_SIZE ?? 50);
  const minScoreToMatch = Number(process.env.MATCHER_MIN_SCORE ?? 0.7);
  const strictnessRaw = (process.env.MATCHER_STRICTNESS ?? "medium").toLowerCase();
  const strictness = strictnessRaw === "low" || strictnessRaw === "high" ? strictnessRaw : "medium";
  const concurrency = Number(process.env.MATCHER_CONCURRENCY ?? config.OPENROUTER_CONCURRENCY);

  while (true) {
    const activeSearches = await db
      .select()
      .from(searches)
      .where(and(eq(searches.isActive, true), eq(searches.isDeleted, false)));

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
  await Promise.all([runScraperLoop(), runMatcherLoop()]);
}

main().catch((error) => {
  console.error("Worker failed", error);
  process.exit(1);
});
