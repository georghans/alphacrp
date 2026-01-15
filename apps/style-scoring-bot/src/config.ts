import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

const localEnvPath = resolve(process.cwd(), ".env");
const repoEnvPath = resolve(process.cwd(), "../../.env");
if (existsSync(localEnvPath)) {
  loadEnv({ path: localEnvPath });
} else if (existsSync(repoEnvPath)) {
  loadEnv({ path: repoEnvPath });
}

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  OPENROUTER_MODEL: z.string().min(1),
  OPENROUTER_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  OPENROUTER_MAX_RETRIES: z.coerce.number().int().min(0).default(3),
  OPENROUTER_RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(60),
  OPENROUTER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  OPENROUTER_REFERER: z.string().optional(),
  OPENROUTER_TITLE: z.string().optional(),
  IMAGE_MAX_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
  IMAGE_CACHE_DIR: z.string().default(".image-cache"),
  FORCE_BASE64_IMAGES: z.coerce.boolean().default(false)
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid environment configuration: ${message}`);
  }
  return parsed.data;
}
