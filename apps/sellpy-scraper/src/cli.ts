import { Command } from "commander";
import pLimit from "p-limit";
import { loadConfig } from "./config.js";
import { createHttpClient } from "./utils/http.js";
import { logger } from "./utils/logger.js";
import { crawlSearch } from "./crawler/searchCrawler.js";
import { crawlOffer } from "./crawler/offerCrawler.js";
import { createDbClient } from "./db/client.js";
import { upsertOffer } from "./db/upsertOffer.js";
import * as schema from "../../../packages/shared-db/src/schema.ts";
const { searches } = schema;
import { eq } from "drizzle-orm";

const program = new Command();

program
  .name("sellpy-scraper")
  .description("Scrape Sellpy offers into PostgreSQL")
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

async function resolveSearchId(
  db: ReturnType<typeof createDbClient>["db"],
  term: string,
  searchId: string | undefined
) {
  if (searchId) {
    return searchId;
  }

  const existing = await db
    .select({ id: searches.id })
    .from(searches)
    .where(eq(searches.title, "Legacy Search"))
    .limit(1);

  if (existing[0]?.id) {
    return existing[0].id;
  }

  const rows = await db
    .insert(searches)
    .values({
      title: "Legacy Search",
      searchTerms: [term],
      searchPrompt: "Legacy import",
      exampleImages: [],
      isActive: true,
      isDeleted: false
    })
    .returning({ id: searches.id });

  if (!rows[0]?.id) {
    throw new Error("Failed to resolve search id");
  }
  return rows[0].id;
}

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

  logger.info({ term: options.term, searchId }, "Starting search crawl");
  const searchOffers = await crawlSearch(
    http,
    config,
    options.term,
    config.maxPages,
    config.maxItems
  );

  logger.info({ count: searchOffers.length }, "Discovered offers");

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

          const result = await upsertOffer(
            db,
            {
              ...details,
              searchId
            },
            images
          );
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
