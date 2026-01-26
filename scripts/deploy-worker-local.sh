#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="ghcr.io/georghans/alphacrp-worker:latest"
IMAGE_SHA_TAG="ghcr.io/georghans/alphacrp-worker:$(git rev-parse HEAD)"
SSH_HOST="root@46.62.233.55"
DEPLOY_PATH="/opt/alphacrp/deploy"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

if [[ -z "${GHCR_USERNAME:-}" || -z "${GHCR_TOKEN:-}" ]]; then
  echo "GHCR_USERNAME and GHCR_TOKEN must be set to push." >&2
  exit 1
fi

echo "Logging in to GHCR..."
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin

echo "Building and pushing worker image..."
docker buildx build -f Dockerfile.worker \
  -t "${IMAGE_TAG}" \
  -t "${IMAGE_SHA_TAG}" \
  --push .

echo "Restarting worker..."
ssh "${SSH_HOST}" "cd ${DEPLOY_PATH} && docker compose --env-file .env.prod -f docker-compose.prod.yml pull worker && docker compose --env-file .env.prod -f docker-compose.prod.yml up -d worker"

echo "Done."
