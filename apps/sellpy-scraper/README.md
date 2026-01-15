# Sellpy Offer Scraper (TypeScript + Playwright)

Production-grade scraper that discovers Sellpy offers for a search term, extracts structured data + image URLs, and upserts into the shared PostgreSQL database with strong deduplication.

## Features
- Fetch-first crawling with Playwright fallback for JS-rendered/infinite-scroll pages
- Robust deduplication using Sellpy native IDs when available, otherwise SHA-256 fallback
- Stores offers + ordered image URLs in PostgreSQL
- Rate limiting, retry logic, concurrency control, structured logging
- Basic extraction tests using fixtures

## Requirements
- Node.js 18+ (for built-in `fetch`)
- PostgreSQL
- Playwright browser binaries (run `pnpm install` + `pnpm exec playwright install` if needed)

## Setup
```bash
pnpm install
cp .env.example .env
```

Update `DATABASE_URL` in `.env` (PostgreSQL connection string).

Run migrations:
```bash
pnpm migrate
```

## Usage
```bash
pnpm dev --term "patagonia jacket" --max-pages 50 --max-items 500
```

Build + run:
```bash
pnpm build
pnpm start --term "patagonia jacket"
```

## Configuration
All config is via environment variables (see `.env.example`). Important ones:
- `SELLPY_BASE_URL`, `SELLPY_SEARCH_PATH`, `SELLPY_SEARCH_QUERY_PARAM`, `SELLPY_PAGE_PARAM`
  - Defaults target `https://www.sellpy.de/search?query=...&page=...`
  - If Sellpy changes URL parameters, adjust these without code changes.
- `SELLPY_USE_PLAYWRIGHT`: `auto` (default), `always`, or `never`
  - `auto` uses fetch first and falls back to Playwright when extraction is empty.

## External ID Strategy
1. **Preferred**: native ID from JSON-LD (`sku`), embedded JSON, or URL path.
2. **Fallback**: `sha256(normalized_offer_url)` using a stable, normalized URL.

Database uniqueness is enforced by `UNIQUE(source, external_id)`.

## Architecture
```
src/
  cli.ts
  config.ts
  crawler/
    searchCrawler.ts
    offerCrawler.ts
  extract/
    extractSearchResults.ts
    extractOfferDetails.ts
    extractImages.ts
  db/
    client.ts
    schema.ts
    migrations/
      001_init.sql
    upsertOffer.ts
  utils/
    hash.ts
    rateLimit.ts
    retry.ts
    logger.ts
    http.ts
    normalize.ts
```

## Tests
```bash
pnpm test
```

## Known Limitations
- Search URL templates are best-effort and configurable; if Sellpy changes them, adjust `.env`.
- Extraction uses heuristics for unknown HTML/JSON structures; adjust extractors if Sellpy reshapes data.
- Rate limits and anti-bot measures are site-dependent; tweak `RATE_LIMIT_RPS` and `CONCURRENCY` as needed.

## Notes on Playwright Usage
Playwright is used only when needed (empty fetch results or missing critical fields). This keeps the default path fast while still handling JS-rendered/infinite scroll.
