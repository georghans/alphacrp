# resale-bot

## Overview
This repo powers Sellpy offer discovery, scoring, and a Next.js UI. It includes:
- Scraper (`apps/sellpy-scraper`) -- discovery + offer scraping via a `discovered_offers` queue
- Style scoring bot (`apps/style-scoring-bot`)
- Web UI + worker (`apps/sellpy-web`)
- Shared DB schema (`packages/shared-db`)

## Architecture
The scraper pipeline is split into two decoupled stages connected by a `discovered_offers` DB queue table:
1. **Discovery** -- `crawlSearch()` finds offer URLs and writes them to `discovered_offers` (status: `pending`).
2. **Offer Scraping** -- claims pending rows, runs `crawlOffer()` + `upsertOffer()`, marks rows as `scraped` (or `failed` after 3 retries).
3. **Matching** -- evaluates offers against search prompts + example images using OpenRouter.

The worker loop (`apps/sellpy-web`) runs all three stages concurrently.

## Local Dev
- Copy `.env.example` to `.env` and fill in values (never commit `.env`).
- Start local Postgres: `docker compose up -d postgres`
- Run migrations: `cd apps/sellpy-scraper && npm run migrate`
- Reference image uploads require S3-compatible storage credentials (see `.env.example`).

## Scraper Commands
```bash
cd apps/sellpy-scraper

# Discovery only (writes to discovered_offers queue)
npm run discover -- -t "jacket" --max-items 20 --max-pages 2

# Scrape pending offers (reads from queue, writes to offers table)
npm run scrape-offers -- --batch-size 20

# Legacy all-in-one (discover + scrape in one pass)
npm run dev -- -t "jacket" --max-items 20
```

## Other Commands
```bash
# Web UI
cd apps/sellpy-web && npm run dev

# Worker loop (discovery + offer scraping + matching)
cd apps/sellpy-web && npm run worker

# Matcher CLI
cd apps/style-scoring-bot && npm run dev -- eval --search <searchId> --max-offers 10
```

## Local Prod-Like Stack (Docker)
1) Create `deploy/.env.prod.local` (do not commit). It should include:
   - `DATABASE_URL=postgresql://user:password@postgres:5432/postgres`
   - `OPENROUTER_API_KEY=...` (required for scoring)
   - `BUCKET_ENDPOINT`, `BUCKET_REGION`, `BUCKET_NAME`, `BUCKET_KEY`, `BUCKET_SECRET` for reference images
2) Build images:
   - `docker build -f Dockerfile.web -t sellpy-web-local .`
   - `docker build -f Dockerfile.worker -t sellpy-worker-local .`
3) Start stack:
   - `docker compose --env-file deploy/.env.prod.local -f deploy/docker-compose.prod.local.yml up -d`
4) Run migrations:
   - `docker compose --env-file deploy/.env.prod.local -f deploy/docker-compose.prod.local.yml run --rm migrate`

## Server Operations (Hetzner)
- **Host**: `46.62.233.55` (SSH as `root`)
- **Deploy dir**: `/opt/alphacrp/deploy`
- **Compose**: `/opt/alphacrp/deploy/docker-compose.prod.yml`
- **Env**: `/opt/alphacrp/deploy/.env.prod`
- **Caddy**: `/opt/alphacrp/deploy/Caddyfile`
- Use the domain for HTTPS (public CAs do not issue certs for bare IPs).

### Logs
```bash
ssh root@46.62.233.55 'cd /opt/alphacrp/deploy && docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f --timestamps --tail=200 web worker'
# or
SSH_HOST=root@46.62.233.55 ./scripts/remote-logs.sh web worker
```

### Database Access (SSH tunnel)
```bash
ssh -L 55432:127.0.0.1:5432 root@46.62.233.55
# Connect locally to 127.0.0.1:55432 using creds from .env.prod
```

## Deploying Updates
Deployment is handled by GitHub Actions on push. Configure GitHub Actions **Secrets** (see AGENTS.md for full list).

## Reference Image Storage
Reference images are uploaded from the web UI to an S3-compatible bucket and stored as public URLs in `searches.example_images`. The matcher consumes these URLs directly when building prompts.
