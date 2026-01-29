import { existsSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
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
  DATABASE_URL: z.string().min(1),
  RATE_LIMIT_RPS: z.string().optional().default("2"),
  CONCURRENCY: z.string().optional().default("3"),
  USER_AGENT: z
    .string()
    .optional()
    .default(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
  MAX_PAGES: z.string().optional(),
  MAX_ITEMS: z.string().optional(),
  SELLPY_BASE_URL: z.string().optional().default("https://www.sellpy.de"),
  ALGOLIA_APP_ID: z.string().optional().default("VXBNWNP8XQ"),
  ALGOLIA_SEARCH_KEY: z.string().optional().default("7a496b7de36cf05a3616039c8040a976"),
  ALGOLIA_INDEX: z.string().optional().default("prod_marketItem_de_relevance"),
  ALGOLIA_HITS_PER_PAGE: z.string().optional().default("60")
});

export type AppConfig = {
  databaseUrl: string;
  rateLimitRps: number;
  concurrency: number;
  userAgent: string;
  maxPages?: number;
  maxItems?: number;
  baseUrl: string;
  algoliaAppId: string;
  algoliaSearchKey: string;
  algoliaIndex: string;
  algoliaHitsPerPage: number;
};

export function loadConfig(): AppConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }

  const env = parsed.data;
  return {
    databaseUrl: env.DATABASE_URL,
    rateLimitRps: Number(env.RATE_LIMIT_RPS),
    concurrency: Number(env.CONCURRENCY),
    userAgent: env.USER_AGENT,
    maxPages: env.MAX_PAGES ? Number(env.MAX_PAGES) : undefined,
    maxItems: env.MAX_ITEMS ? Number(env.MAX_ITEMS) : undefined,
    baseUrl: env.SELLPY_BASE_URL,
    algoliaAppId: env.ALGOLIA_APP_ID,
    algoliaSearchKey: env.ALGOLIA_SEARCH_KEY,
    algoliaIndex: env.ALGOLIA_INDEX,
    algoliaHitsPerPage: Number(env.ALGOLIA_HITS_PER_PAGE)
  };
}
