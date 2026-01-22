# resale-bot

## Overview
This repo powers Sellpy offer discovery, scoring, and a Next.js UI. It includes:
- Scraper (`apps/sellpy-scraper`)
- Style scoring bot (`apps/style-scoring-bot`)
- Web UI (`apps/sellpy-web`)
- Shared DB schema (`packages/shared-db`)

## Local Dev
- Configure `.env` at repo root (used by all apps).
- Start local Postgres: `docker compose up -d postgres`
- Run migrations: `cd apps/sellpy-scraper && npm run migrate`

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
- Update `/opt/alphacrp/deploy/.env.prod` for secrets and `DATABASE_URL`.
- Apply changes:
  - `cd /opt/alphacrp/deploy && docker compose --env-file .env.prod -f docker-compose.prod.yml up -d`
