import { Command } from "commander";
import pLimit from "p-limit";
import { loadConfig } from "./config.js";
import { createHttpClient } from "./utils/http.js";
import { logger } from "./utils/logger.js";
import { crawlSearch } from "./crawler/searchCrawler.js";
import { crawlOffer } from "./crawler/offerCrawler.js";
import { createDbClient } from "./db/client.js";
import { upsertOffer } from "./db/upsertOffer.js";

const program = new Command();

program
  .name("sellpy-scraper")
  .description("Scrape Sellpy offers into PostgreSQL")
  .requiredOption("-t, --term <term>", "Search term")
  .option("--max-pages <number>", "Maximum pages to crawl", (v) => Number(v))
  .option("--max-items <number>", "Maximum items to crawl", (v) => Number(v))
  .option("--headless <boolean>", "Override headless setting", (v) => v === "true")
  .parse(process.argv);

const options = program.opts<{
  term: string;
  maxPages?: number;
  maxItems?: number;
  headless?: boolean;
}>();

async function main() {
  const baseConfig = loadConfig();
  const config = {
    ...baseConfig,
    maxPages: options.maxPages ?? baseConfig.maxPages,
    maxItems: options.maxItems ?? baseConfig.maxItems,
    headless: options.headless ?? baseConfig.headless
  };

  const http = createHttpClient({
    userAgent: config.userAgent,
    rateLimitRps: config.rateLimitRps
  });

  logger.info({ term: options.term }, "Starting search crawl");
  const searchOffers = await crawlSearch(
    http,
    config,
    options.term,
    config.maxPages,
    config.maxItems
  );

  logger.info({ count: searchOffers.length }, "Discovered offers");

  const { db, pool } = createDbClient(config.databaseUrl);
  const limit = pLimit(config.concurrency);

  let processed = 0;
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  await Promise.all(
    searchOffers.map((offer) =>
      limit(async () => {
        try {
          const { offer: details, images } = await crawlOffer(
            http,
            config,
            options.term,
            offer.url,
            offer.nativeExternalId
          );

          const result = await upsertOffer(db, details, images);
          if (result.isNew) inserted += 1;
          else updated += 1;
          processed += 1;
        } catch (error) {
          errors += 1;
          logger.error({ error, url: offer.url }, "Failed to crawl offer");
        }
      })
    )
  );

  await pool.end();

  logger.info(
    {
      discovered: searchOffers.length,
      processed,
      inserted,
      updated,
      errors
    },
    "Scrape summary"
  );
}

main().catch((error) => {
  logger.error({ error }, "Fatal error");
  process.exit(1);
});
