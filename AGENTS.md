# AGENTS.md

## Project Purpose
Automate Sellpy item discovery and matching. The system scrapes Sellpy offers, stores them in Postgres, and evaluates offers against search prompts + example images using OpenRouter, exposing results in a unified Next.js UI.
Reference images are uploaded to an S3-compatible bucket (Hetzner Object Storage) and stored as public URLs in the database.

## Structure
- `apps/sellpy-web`: Next.js app with login + UI for searches, offers, matches. Also runs the worker loop.
- Reference images are uploaded via `POST /api/reference-images` to S3-compatible storage and stored as URLs in `searches.example_images` (UI enforces 1-5 images).
- `apps/sellpy-scraper`: crawls Sellpy search results and offer pages, extracts metadata + images. Provides three CLIs: `cli.ts` (legacy all-in-one), `cli-discover.ts` (discovery only), `cli-scrape-offers.ts` (offer scraping from queue).
- `apps/style-scoring-bot`: evaluates offers against searches using OpenRouter (Gemini 3 Flash).
- `packages/shared-db`: shared Drizzle schema + migrations + Postgres client.
- `docker-compose.yml`: local Postgres setup.

## Architecture (High Level)
1) **Discover**: `apps/sellpy-scraper` discovers offer URLs for a search term via `crawlSearch()` and writes them to the `discovered_offers` queue table with `status = 'pending'`.
2) **Scrape**: A separate stage reads pending rows from `discovered_offers`, runs `crawlOffer()` to extract metadata + images, upserts into the `offers` table, and marks the queue row as `scraped` (or `failed` after 3 retries).
3) **Score**: `apps/style-scoring-bot` reads offers for a search, builds prompts from search prompt + example image URLs (bucket), calls OpenRouter, and stores decisions in `offer_search_evaluations`.
4) **View**: `apps/sellpy-web` reads from Postgres to show searches, all offers, and matched offers.

The worker loop (`apps/sellpy-web/src/worker/loop.ts`) runs three concurrent loops:
- **Discovery loop**: polls active searches, runs `crawlSearch()`, writes to `discovered_offers`.
- **Offer scraper loop**: claims pending `discovered_offers` rows, runs `crawlOffer()` + `upsertOffer()`, updates status.
- **Matcher loop**: evaluates unevaluated offers against search prompts using OpenRouter.

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

### Local Prod-Like Stack (Docker)
- Env file (local only): `deploy/.env.prod.local`
- Build images:
  - `docker build -f Dockerfile.web -t sellpy-web-local .`
  - `docker build -f Dockerfile.worker -t sellpy-worker-local .`
- Start stack:
  - `docker compose --env-file deploy/.env.prod.local -f deploy/docker-compose.prod.local.yml up -d`
- Run migrations:
  - `docker compose --env-file deploy/.env.prod.local -f deploy/docker-compose.prod.local.yml run --rm migrate`

### Scraper
- **Discovery only** (writes to `discovered_offers` queue):
  `cd apps/sellpy-scraper && npm run discover -- -t "jacket" --max-items 20 --max-pages 2 --search-id <searchId>`
- **Scrape pending offers** (reads from `discovered_offers`, writes to `offers`):
  `cd apps/sellpy-scraper && npm run scrape-offers -- --batch-size 20`
- **Legacy all-in-one** (discover + scrape in one pass):
  `cd apps/sellpy-scraper && npm run dev -- -t "jacket" --max-items 20 --max-pages 2 --search-id <searchId>`

### Matcher
- Run (limit offers): `cd apps/style-scoring-bot && npm run dev -- eval --search <searchId> --max-offers 10 --batch-size 5 --concurrency 2`

### Web
- Dev server: `cd apps/sellpy-web && npm run dev`
- Worker loop: `cd apps/sellpy-web && npm run worker`

## Operations (Server)
- **Host**: Hetzner VM at `46.62.233.55` (SSH as `root`).
- **Deploy path**: `/opt/alphacrp/deploy`
- **Compose file**: `/opt/alphacrp/deploy/docker-compose.prod.yml`
- **Env file**: `/opt/alphacrp/deploy/.env.prod` (all runtime secrets + `DATABASE_URL`)
- **Reverse proxy**: Caddy (`/opt/alphacrp/deploy/Caddyfile`)
- **HTTP/HTTPS**:
  - `http://46.62.233.55` works (IP HTTP).
  - HTTPS should be used via the domain (e.g. `https://georghans.de`) because public CAs do not issue certs for bare IPs.

## Logs (Server)
- **Tail logs via SSH**:
  - `ssh root@46.62.233.55 'cd /opt/alphacrp/deploy && docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f --timestamps --tail=200 web worker'`
  - Helper script: `scripts/remote-logs.sh` (run locally with `SSH_HOST=root@46.62.233.55`)
- **Rotation**: Docker log rotation enabled in compose (`driver: local`, `max-size: 50m`, `max-file: 5`) to prevent unbounded growth.

## Database Access (Server)
- **SSH tunnel** (manual):
  - `ssh -L 55432:127.0.0.1:5432 root@46.62.233.55`
  - Connect locally to `127.0.0.1:55432` using the creds from `/opt/alphacrp/deploy/.env.prod`.
- **IntelliJ tunnel**:
  - General tab host/port should be the **remote DB** (`127.0.0.1:5432`).
  - SSH/SSL tab sets the local tunnel port (e.g. `55432`) and SSH host.

## Development Environment
- Use `.env.example` as a template for local `.env` (never commit `.env`).
- Requires local Postgres (Docker recommended).
- Playwright Chromium must be installed for scraping.
- OpenRouter API key + model required for evaluation.
- Reference image uploads require S3-compatible storage credentials (`BUCKET_*` vars in `.env.example`).

## Deployment Secrets (GitHub Actions)
- Secrets required for deploy workflow (never commit to repo):
  - `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `SSH_KEY_PASSPHRASE`
  - `DOMAIN`, `LETSENCRYPT_EMAIL`
  - `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD`, `DATABASE_URL`
  - `APP_USERNAME`, `APP_PASSWORD`
  - `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `GHCR_USERNAME`, `GHCR_TOKEN` (optional)
  - `BUCKET_ENDPOINT`, `BUCKET_REGION`, `BUCKET_NAME`, `BUCKET_KEY`, `BUCKET_SECRET`
  - Optional: `BUCKET_PUBLIC_BASE_URL`, `BUCKET_FORCE_PATH_STYLE`

## Development DB Reset
- During early development it is acceptable to wipe the database before each run.
- It is also acceptable to wipe the database to apply clean migrations.

## Subprojects

### apps/sellpy-scraper
- **Purpose**: Discover and normalize Sellpy offers and images for a given search term.
- **Entry points**:
  - `src/cli.ts` -- legacy all-in-one (discover + scrape in one pass)
  - `src/cli-discover.ts` -- discovery only, writes to `discovered_offers` queue
  - `src/cli-scrape-offers.ts` -- scrapes pending offers from `discovered_offers` queue
- **Key modules**:
  - Crawlers: `src/crawler/searchCrawler.ts`, `src/crawler/offerCrawler.ts`
  - Extractors: `src/extract/*`
  - DB: `src/db/*` -- `upsertOffer.ts`, `upsertDiscoveredOffer.ts`, `discoveredOfferQueue.ts`, `resolveSearchId.ts`
  - Utilities: `src/utils/*` (rate limit, retry, logging, http, hashing)
- **Database**: PostgreSQL via shared Drizzle schema

### apps/style-scoring-bot
- **Purpose**: Score offers against style profiles and record model decisions.
- **Entry point**: `src/cli.ts`
- **Key modules**:
  - Evaluator: `src/evaluator/*` (prompt construction + OpenRouter client)
  - Profiles: `src/styles/profiles.ts`
  - DB: `src/db/*` (uses shared Drizzle schema + migrations)
  - Utilities: `src/utils/*` (rate limit, retry, logging, image cache)
- **Database**: PostgreSQL via shared Drizzle schema
- **Model API**: OpenRouter (Gemini 3 Flash model slug configured via env)

### apps/sellpy-web
- **Purpose**: Next.js UI for managing searches, viewing offers/matches. Also hosts the worker loop.
- **Worker loop** (`src/worker/loop.ts`): runs three concurrent loops -- discovery, offer scraping, and matching.

### packages/shared-db
- **Purpose**: Shared Drizzle schema, migrations, and Postgres client.
- **Tables**: `searches`, `offers`, `offer_images`, `discovered_offers`, `offer_search_evaluations`

## What The Apps Do (Concise)
- **apps/sellpy-scraper**: Given a search term, discovers offer URLs (discovery stage) and scrapes offer metadata + images (scraping stage), connected by the `discovered_offers` queue table.
- **apps/style-scoring-bot**: Given a style profile (prompt + example image URLs), evaluates offers with a multimodal model, producing MATCH/NO_MATCH decisions and scores.
- **apps/sellpy-web**: UI + worker. The worker runs discovery, offer scraping, and matching loops continuously.
