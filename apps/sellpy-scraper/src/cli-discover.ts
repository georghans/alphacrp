import { Command } from "commander";
import { loadConfig } from "./config.js";
import { createHttpClient } from "./utils/http.js";
import { logger } from "./utils/logger.js";
import { crawlSearch } from "./crawler/searchCrawler.js";
import { createDbClient } from "./db/client.js";
import { resolveSearchId } from "./db/resolveSearchId.js";
import { upsertDiscoveredOffer } from "./db/upsertDiscoveredOffer.js";

const program = new Command();

program
  .name("sellpy-discover")
  .description("Discover Sellpy offer URLs and queue them for scraping")
  .requiredOption("-t, --term <term>", "Search term")
  .option("--search-id <id>", "Search ID to attach offers to")
  .option("--max-pages <number>", "Maximum pages to crawl", (v) => Number(v))
  .option("--max-items <number>", "Maximum items to crawl", (v) => Number(v))
  .option("--headless <boolean>", "Override headless setting", (v) => v === "true")
  .parse(process.argv);

const options = program.opts<{
  term: string;
  searchId?: string;
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

  const { db, pool } = createDbClient(config.databaseUrl);
  const searchId = await resolveSearchId(db, options.term, options.searchId);

  logger.info({ term: options.term, searchId }, "Starting discovery crawl");
  const searchOffers = await crawlSearch(
    http,
    config,
    options.term,
    config.maxPages,
    config.maxItems
  );

  logger.info({ count: searchOffers.length }, "Crawl returned offers");

  let newCount = 0;
  let existingCount = 0;

  for (const offer of searchOffers) {
    const result = await upsertDiscoveredOffer(db, {
      searchId,
      source: "sellpy",
      externalId: offer.nativeExternalId ?? null,
      searchTerm: options.term,
      url: offer.url,
      rawMetadata: (offer.raw as Record<string, unknown>) ?? (offer.metadata as Record<string, unknown>) ?? {}
    });

    if (result.isNew) newCount += 1;
    else existingCount += 1;
  }

  await pool.end();

  logger.info(
    {
      discovered: searchOffers.length,
      new: newCount,
      existing: existingCount
    },
    "Discovery summary"
  );
}

main().catch((error) => {
  logger.error({ error }, "Fatal error");
  process.exit(1);
});
