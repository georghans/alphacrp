import { Command } from "commander";
import { readFile } from "fs/promises";
import { loadConfig } from "./config.js";
import { pool } from "./db/client.js";
import { createSearch } from "./searches.js";
import { styleProfileInputSchema } from "./evaluator/schemas.js";
import { OpenRouterClient } from "./evaluator/openrouterClient.js";
import { runEvaluation } from "./queue/worker.js";
import { logger } from "./utils/logger.js";

const program = new Command();

program
  .name("style-scoring-bot")
  .description("Evaluate Sellpy offers against searches using Gemini via OpenRouter")
  .version("0.1.0");

program
  .command("create-search")
  .alias("create-profile")
  .requiredOption("--name <name>", "Search name")
  .requiredOption("--prompt <prompt>", "Search prompt")
  .requiredOption("--examples <file>", "Path to JSON array of example image URLs or file paths")
  .action(async (options) => {
    try {
      const raw = await readFile(options.examples, "utf8");
      const exampleImages = JSON.parse(raw);
      const input = styleProfileInputSchema.parse({
        name: options.name,
        style_prompt: options.prompt,
        example_images: exampleImages
      });

      const search = await createSearch(input);
      logger.info({ searchId: search.id }, "Created search");
    } catch (error) {
      logger.error({ error }, "Failed to create style profile");
      process.exitCode = 1;
    } finally {
      await pool.end();
    }
  });

program
  .command("eval")
  .requiredOption("--search <id>", "Search ID")
  .option("--batch-size <n>", "Batch size", "50")
  .option("--concurrency <n>", "Concurrency", "5")
  .option("--min-score <n>", "Minimum score to match", "0.7")
  .option("--strictness <level>", "low | medium | high", "medium")
  .option("--offer-id <id>", "Single offer ID")
  .option("--max-offers <n>", "Maximum offers to evaluate", "0")
  .option("--force", "Re-evaluate offers even if already decided", false)
  .option("--dry-run", "Do not write results", false)
  .action(async (options) => {
    const config = loadConfig();
    const client = new OpenRouterClient(config);
    const strictness =
      options.strictness === "low" || options.strictness === "high"
        ? options.strictness
        : "medium";

    try {
      await runEvaluation(client, {
        searchId: options.search,
        batchSize: Number(options.batchSize),
        concurrency: Number(options.concurrency),
        minScoreToMatch: Number(options.minScore),
        strictness,
        dryRun: Boolean(options.dryRun),
        force: Boolean(options.force),
        offerId: options.offerId,
        maxOffers: Number(options.maxOffers) > 0 ? Number(options.maxOffers) : undefined
      });
    } catch (error) {
      logger.error({ error }, "Evaluation run failed");
      process.exitCode = 1;
    } finally {
      await pool.end();
    }
  });

program.parseAsync(process.argv);
