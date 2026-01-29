import { Command } from "commander";
import pLimit from "p-limit";
import { loadConfig } from "./config.js";
import { createHttpClient } from "./utils/http.js";
import { logger } from "./utils/logger.js";
import { crawlOffer } from "./crawler/offerCrawler.js";
import { extractAlgoliaOffer, isAlgoliaHit } from "./extract/extractAlgoliaOffer.js";
import { createDbClient } from "./db/client.js";
import { upsertOffer } from "./db/upsertOffer.js";
import {
  claimPendingOffers,
  markScraped,
  markFailed
} from "./db/discoveredOfferQueue.js";

const program = new Command();

program
  .name("sellpy-scrape-offers")
  .description("Scrape pending discovered offers from the queue")
  .option("--batch-size <number>", "Number of offers to claim per batch", (v) => Number(v), 20)
  .option("--headless <boolean>", "Override headless setting", (v) => v === "true")
  .parse(process.argv);

const options = program.opts<{
  batchSize: number;
  headless?: boolean;
}>();

async function main() {
  const baseConfig = loadConfig();
  const config = {
    ...baseConfig,
    headless: options.headless ?? baseConfig.headless
  };

  const http = createHttpClient({
    userAgent: config.userAgent,
    rateLimitRps: config.rateLimitRps
  });

  const { db, pool } = createDbClient(config.databaseUrl);

  logger.info({ batchSize: options.batchSize }, "Claiming pending offers");
  const claimed = await claimPendingOffers(db, options.batchSize);

  if (claimed.length === 0) {
    logger.info("No pending offers to scrape");
    await pool.end();
    return;
  }

  logger.info({ count: claimed.length }, "Claimed offers for scraping");

  const limit = pLimit(config.concurrency);
  let scraped = 0;
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  await Promise.all(
    claimed.map((row) =>
      limit(async () => {
        try {
          let details: Awaited<ReturnType<typeof crawlOffer>>["offer"];
          let images: Awaited<ReturnType<typeof crawlOffer>>["images"];

          const algoliaResult = isAlgoliaHit(row.rawMetadata)
            ? extractAlgoliaOffer(row.rawMetadata, row.searchTerm, row.url, row.externalId ?? undefined)
            : null;

          if (algoliaResult) {
            details = algoliaResult.offer;
            images = algoliaResult.images;
            logger.info({ url: row.url }, "Extracted offer from Algolia metadata");
          } else {
            const crawled = await crawlOffer(
              http,
              config,
              row.searchTerm,
              row.url,
              row.externalId ?? undefined
            );
            details = crawled.offer;
            images = crawled.images;
          }

          const result = await upsertOffer(
            db,
            {
              ...details,
              searchId: row.searchId
            },
            images
          );

          await markScraped(db, row.id);
          scraped += 1;
          if (result.isNew) inserted += 1;
          else updated += 1;
        } catch (error) {
          errors += 1;
          const message = error instanceof Error ? error.message : String(error);
          await markFailed(db, row.id, message);
          logger.error({ error, url: row.url }, "Failed to scrape offer");
        }
      })
    )
  );

  await pool.end();

  logger.info(
    {
      claimed: claimed.length,
      scraped,
      inserted,
      updated,
      errors
    },
    "Offer scrape summary"
  );
}

main().catch((error) => {
  logger.error({ error }, "Fatal error");
  process.exit(1);
});
