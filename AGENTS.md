# AGENTS.md

## Overview
This repo contains two TypeScript/Node.js apps plus a shared DB package:
- `apps/sellpy-scraper`: crawls Sellpy search results and offer pages, extracting structured offer data and image URLs.
- `apps/style-scoring-bot`: evaluates stored offers against style profiles using OpenRouter (Gemini 3 Flash) and persists scoring decisions.
- `packages/shared-db`: shared Drizzle schema + migrations + Postgres client used by both apps.

## Architecture (High Level)
1) **Scrape**: `apps/sellpy-scraper` discovers offers for a search term, extracts metadata + ordered images, and upserts into the shared PostgreSQL database.
2) **Score**: `apps/style-scoring-bot` reads offers (and images) from the same PostgreSQL database, builds prompts from style profiles + example images, calls OpenRouter, and stores match decisions and scores.

The two apps are decoupled and run independently; data flow is via the shared database schema.

## Subprojects

### apps/sellpy-scraper
- **Purpose**: Discover and normalize Sellpy offers and images for a given search term.
- **Entry point**: `apps/sellpy-scraper/src/cli.ts`
- **Key modules**:
  - Crawlers: `apps/sellpy-scraper/src/crawler/searchCrawler.ts`, `apps/sellpy-scraper/src/crawler/offerCrawler.ts`
  - Extractors: `apps/sellpy-scraper/src/extract/*`
  - DB: `apps/sellpy-scraper/src/db/*` (uses shared Drizzle schema + migrations)
  - Utilities: `apps/sellpy-scraper/src/utils/*` (rate limit, retry, logging, http, hashing)
- **Database**: PostgreSQL via shared Drizzle schema

### apps/style-scoring-bot
- **Purpose**: Score offers against style profiles and record model decisions.
- **Entry point**: `apps/style-scoring-bot/src/cli.ts`
- **Key modules**:
  - Evaluator: `apps/style-scoring-bot/src/evaluator/*` (prompt construction + OpenRouter client)
  - Profiles: `apps/style-scoring-bot/src/styles/profiles.ts`
  - DB: `apps/style-scoring-bot/src/db/*` (uses shared Drizzle schema + migrations)
  - Utilities: `apps/style-scoring-bot/src/utils/*` (rate limit, retry, logging, image cache)
- **Database**: PostgreSQL via shared Drizzle schema
- **Model API**: OpenRouter (Gemini 3 Flash model slug configured via env)

## Technologies Used
- **Language/Runtime**: TypeScript, Node.js (ESM)
- **Scraping**: Playwright (fallback for JS-rendered pages), Cheerio (HTML parsing)
- **DB (shared)**: PostgreSQL, Drizzle ORM
- **CLI**: Commander, tsx
- **Validation/Config**: Zod, dotenv
- **Logging/infra**: pino, rate limiting + retry helpers

## What The Apps Do (Concise)
- **apps/sellpy-scraper**: Given a search term, it crawls Sellpy, extracts offer metadata + images, and stores/upserts the results in the shared PostgreSQL database.
- **apps/style-scoring-bot**: Given a style profile (prompt + example images), it evaluates offers in the shared database with a multimodal model, producing MATCH/NO_MATCH decisions and scores for later filtering or alerting.
