# AGENTS.md

## Project Purpose
Automate Sellpy item discovery and matching. The system scrapes Sellpy offers, stores them in Postgres, and evaluates offers against search prompts + example images using OpenRouter, exposing results in a unified Next.js UI.

## Structure
- `apps/sellpy-web`: Next.js app with login + UI for searches, offers, matches.
- `apps/sellpy-scraper`: crawls Sellpy search results and offer pages, extracts metadata + images.
- `apps/style-scoring-bot`: evaluates offers against searches using OpenRouter (Gemini 3 Flash).
- `packages/shared-db`: shared Drizzle schema + migrations + Postgres client.
- `docker-compose.yml`: local Postgres setup.

## Architecture (High Level)
1) **Scrape**: `apps/sellpy-scraper` discovers offers for a search term, extracts metadata + images, and upserts into Postgres with a `search_id`.
2) **Score**: `apps/style-scoring-bot` reads offers for a search, builds prompts from search prompt + example images, calls OpenRouter, and stores decisions in `offer_search_evaluations`.
3) **View**: `apps/sellpy-web` reads from Postgres to show searches, all offers, and matched offers.

## Technologies
- TypeScript, Node.js (ESM)
- Next.js (App Router)
- PostgreSQL + Drizzle ORM
- Playwright (scraping + screenshots)
- OpenRouter (Gemini 3 Flash)
- Commander, tsx, Zod, dotenv, pino

## Important Commands
### Database
- Start Postgres: `docker start sellpy-postgres`
- Reset DB (early dev ok): `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
- Migrate: `cd apps/sellpy-scraper && npm run migrate`

### Scraper
- Run: `cd apps/sellpy-scraper && npm run dev -- --term "jacket" --max-items 20 --max-pages 2 --search-id <searchId>`

### Matcher
- Run (limit offers): `cd apps/style-scoring-bot && npm run dev -- eval --search <searchId> --max-offers 10 --batch-size 5 --concurrency 2`

### Web
- Dev server: `cd apps/sellpy-web && npm run dev`
- Worker loop: `cd apps/sellpy-web && npm run worker`

## Development Environment
- `.env` at repo root provides configuration for all apps.
- Requires local Postgres (Docker recommended).
- Playwright Chromium must be installed for scraping.
- OpenRouter API key + model required for evaluation.

## Development DB Reset
- During early development it is acceptable to wipe the database before each run.
- It is also acceptable to wipe the database to apply clean migrations.

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
