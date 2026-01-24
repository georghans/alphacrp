# resale-bot

## Overview
This repo powers Sellpy offer discovery, scoring, and a Next.js UI. It includes:
- Scraper (`apps/sellpy-scraper`)
- Style scoring bot (`apps/style-scoring-bot`)
- Web UI (`apps/sellpy-web`)
- Shared DB schema (`packages/shared-db`)

## Local Dev
- Copy `.env.example` to `.env` and fill in values (never commit `.env`).
- Start local Postgres: `docker compose up -d postgres`
- Run migrations: `cd apps/sellpy-scraper && npm run migrate`
- Reference image uploads require S3-compatible storage credentials (see `.env.example`).

## Local Prod-Like Stack (Docker)
Use the prod-style compose locally with local images and an env file.

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

### HTTP/HTTPS
- `http://46.62.233.55` works (IP HTTP).
- Use the domain for HTTPS (public CAs do not issue certs for bare IPs).

### Logs (easy access)
- Tail logs via SSH:
  - `ssh root@46.62.233.55 'cd /opt/alphacrp/deploy && docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f --timestamps --tail=200 web worker'`
- Helper script:
  - `SSH_HOST=root@46.62.233.55 ./scripts/remote-logs.sh web worker`
- Log rotation is enabled in compose (`driver: local`, `max-size: 50m`, `max-file: 5`).

### Database Access (SSH tunnel)
- Manual tunnel:
  - `ssh -L 55432:127.0.0.1:5432 root@46.62.233.55`
- Connect locally to `127.0.0.1:55432` using creds from `/opt/alphacrp/deploy/.env.prod`.

### IntelliJ SSH Tunnel (gotcha)
When using IntelliJ’s built-in SSH tunnel:
- **General tab** host/port should be the **remote DB** (`127.0.0.1:5432`).
- **SSH/SSL tab** sets the local tunnel port (e.g. `55432`) and SSH host.

## Deploying Updates
- Deployment is handled by GitHub Actions on push.
- Configure GitHub Actions **Secrets** (not committed in repo). Required secrets:
  - `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `SSH_KEY_PASSPHRASE`
  - `DOMAIN`, `LETSENCRYPT_EMAIL`
  - `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD`, `DATABASE_URL`
  - `APP_USERNAME`, `APP_PASSWORD`
  - `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `GHCR_USERNAME`, `GHCR_TOKEN` (optional)
  - `BUCKET_ENDPOINT`, `BUCKET_REGION`, `BUCKET_NAME`, `BUCKET_KEY`, `BUCKET_SECRET`
  - Optional: `BUCKET_PUBLIC_BASE_URL`, `BUCKET_FORCE_PATH_STYLE`
- The workflow writes `/opt/alphacrp/deploy/.env.prod` on the server from secrets.

## Reference Image Storage
- Reference images are uploaded from the web UI to an S3-compatible bucket and stored as public URLs in `searches.example_images`.
- Upload endpoint: `POST /api/reference-images` (used by the UI).
- Matcher consumes the stored URLs directly when building prompts.
