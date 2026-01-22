#!/usr/bin/env bash
set -euo pipefail

SSH_HOST=${SSH_HOST:-}
if [[ -z "${SSH_HOST}" ]]; then
  echo "Usage: SSH_HOST=user@host $0 [service...]" >&2
  exit 1
fi

SERVICES=("$@")
if [[ ${#SERVICES[@]} -eq 0 ]]; then
  SERVICES=(web worker)
fi

ssh "${SSH_HOST}" "cd /opt/alphacrp/deploy && docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f --timestamps --tail=200 ${SERVICES[*]}"
