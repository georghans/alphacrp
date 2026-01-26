#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

IMAGE_NAME="${IMAGE_NAME:-sellpy-worker-local}"
ENV_FILE="${ENV_FILE:-${REPO_ROOT}/.env}"

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 --term \"query\" [--max-items 20 --max-pages 2 --search-id <id>]" >&2
  exit 1
fi

if [[ "${SKIP_BUILD:-}" != "1" ]]; then
  echo "Building worker image..."
  docker build -f "${REPO_ROOT}/Dockerfile.worker" -t "${IMAGE_NAME}" "${REPO_ROOT}"
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Env file not found: ${ENV_FILE}" >&2
  echo "Set ENV_FILE=/path/to/.env or create ${REPO_ROOT}/.env" >&2
  exit 1
fi

echo "Running scraper in container..."
docker run --rm \
  --env-file "${ENV_FILE}" \
  -w /app/apps/sellpy-scraper \
  "${IMAGE_NAME}" \
  npm run dev -- "$@"
