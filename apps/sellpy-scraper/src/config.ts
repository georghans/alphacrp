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
  HEADLESS: z.string().optional().default("true"),
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
  SELLPY_SEARCH_PATH: z.string().optional().default("/search"),
  SELLPY_SEARCH_QUERY_PARAM: z.string().optional().default("query"),
  SELLPY_PAGE_PARAM: z.string().optional().default("page"),
  SELLPY_LOCALE: z.string().optional().default("en"),
  SELLPY_USE_PLAYWRIGHT: z.string().optional().default("auto"),
  IMAGE_MAX_BYTES: z.string().optional().default(String(5 * 1024 * 1024)),
  ALGOLIA_APP_ID_DE: z.string().optional().default("VXBNWNP8XQ"),
  ALGOLIA_SEARCH_KEY_DE: z.string().optional().default("7a496b7de36cf05a3616039c8040a976"),
  ALGOLIA_INDEX_DE: z.string().optional().default("prod_marketItem_de_relevance"),
  ALGOLIA_HITS_PER_PAGE: z.string().optional().default("60")
});

export type AppConfig = {
  databaseUrl: string;
  headless: boolean;
  rateLimitRps: number;
  concurrency: number;
  userAgent: string;
  maxPages?: number;
  maxItems?: number;
  baseUrl: string;
  searchPath: string;
  searchQueryParam: string;
  pageParam: string;
  locale: string;
  usePlaywright: "auto" | "always" | "never";
  imageMaxBytes: number;
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
    headless: env.HEADLESS !== "false",
    rateLimitRps: Number(env.RATE_LIMIT_RPS),
    concurrency: Number(env.CONCURRENCY),
    userAgent: env.USER_AGENT,
    maxPages: env.MAX_PAGES ? Number(env.MAX_PAGES) : undefined,
    maxItems: env.MAX_ITEMS ? Number(env.MAX_ITEMS) : undefined,
    baseUrl: env.SELLPY_BASE_URL,
    searchPath: env.SELLPY_SEARCH_PATH,
    searchQueryParam: env.SELLPY_SEARCH_QUERY_PARAM,
    pageParam: env.SELLPY_PAGE_PARAM,
    locale: env.SELLPY_LOCALE,
    usePlaywright:
      env.SELLPY_USE_PLAYWRIGHT === "always"
        ? "always"
        : env.SELLPY_USE_PLAYWRIGHT === "never"
          ? "never"
          : "auto",
    imageMaxBytes: Number(env.IMAGE_MAX_BYTES),
    algoliaAppId: env.ALGOLIA_APP_ID_DE,
    algoliaSearchKey: env.ALGOLIA_SEARCH_KEY_DE,
    algoliaIndex: env.ALGOLIA_INDEX_DE,
    algoliaHitsPerPage: Number(env.ALGOLIA_HITS_PER_PAGE)
  };
}
