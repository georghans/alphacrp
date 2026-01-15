import { Command } from "commander";
import { readFile } from "fs/promises";
import { loadConfig } from "./config.js";
import { pool } from "./db/client.js";
import { createStyleProfile } from "./styles/profiles.js";
import { styleProfileInputSchema } from "./evaluator/schemas.js";
import { OpenRouterClient } from "./evaluator/openrouterClient.js";
import { runEvaluation } from "./queue/worker.js";
import { logger } from "./utils/logger.js";

const program = new Command();

program
  .name("style-scoring-bot")
  .description("Evaluate Sellpy offers against style profiles using Gemini via OpenRouter")
  .version("0.1.0");

program
  .command("create-profile")
  .requiredOption("--name <name>", "Profile name")
  .requiredOption("--prompt <prompt>", "Style prompt")
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

      const profile = await createStyleProfile(input);
      logger.info({ profileId: profile.id }, "Created style profile");
    } catch (error) {
      logger.error({ error }, "Failed to create style profile");
      process.exitCode = 1;
    } finally {
      await pool.end();
    }
  });

program
  .command("eval")
  .requiredOption("--profile <id>", "Style profile ID")
  .option("--batch-size <n>", "Batch size", "50")
  .option("--concurrency <n>", "Concurrency", "5")
  .option("--min-score <n>", "Minimum score to match", "0.7")
  .option("--strictness <level>", "low | medium | high", "medium")
  .option("--offer-id <id>", "Single offer ID")
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
        styleProfileId: options.profile,
        batchSize: Number(options.batchSize),
        concurrency: Number(options.concurrency),
        minScoreToMatch: Number(options.minScore),
        strictness,
        dryRun: Boolean(options.dryRun),
        force: Boolean(options.force),
        offerId: options.offerId
      });
    } catch (error) {
      logger.error({ error }, "Evaluation run failed");
      process.exitCode = 1;
    } finally {
      await pool.end();
    }
  });

program.parseAsync(process.argv);
