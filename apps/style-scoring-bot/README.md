# Style Scoring Bot

Scores Sellpy offers against style profiles using Gemini Flash 3 via OpenRouter.
Uses the shared PostgreSQL schema via Drizzle.

## Setup

1. Install deps

```
pnpm install
```

2. Configure environment

Create `.env` with:

```
DATABASE_URL=postgresql://user:pass@host:5432/db
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=google/gemini-3-flash-preview
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_TIMEOUT_MS=30000
OPENROUTER_MAX_RETRIES=3
OPENROUTER_RATE_LIMIT_PER_MIN=60
OPENROUTER_CONCURRENCY=5
IMAGE_MAX_BYTES=5242880
IMAGE_CACHE_DIR=.image-cache
FORCE_BASE64_IMAGES=false
```

`OPENROUTER_MODEL` should match the current OpenRouter model slug for Gemini 3 Flash. Check the OpenRouter Models API if the slug changes.

3. Run migrations

```
pnpm migrate
```

## Usage

Create a style profile:

```
pnpm dev create-profile \
  --name "Minimal Linen" \
  --prompt "Minimal, relaxed linen, neutral tones, no logos" \
  --examples ./examples.json
```

`examples.json` should be a JSON array of image URLs or local file paths:

```
[
  "https://example.com/style1.jpg",
  "./reference-images/style2.png"
]
```

Evaluate offers for a profile:

```
pnpm dev eval --profile <uuid> --batch-size 50 --concurrency 5
```

Single offer debug:

```
pnpm dev eval --profile <uuid> --offer-id <offer_uuid>
```

Dry run (no writes):

```
pnpm dev eval --profile <uuid> --dry-run
```

Force re-evaluation (ignores existing decisions):

```
pnpm dev eval --profile <uuid> --force
```

## Notes

- Only offers with at least one image and a title are evaluated.
- Results are upserted to keep runs idempotent.
- If you must base64 remote images, set `FORCE_BASE64_IMAGES=true` to download and cache them.
