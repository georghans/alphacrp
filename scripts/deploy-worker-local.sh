#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="ghcr.io/georghans/alphacrp-worker:latest"
SSH_HOST="root@46.62.233.55"
DEPLOY_PATH="/opt/alphacrp/deploy"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

echo "Building worker image..."
docker build -f Dockerfile.worker -t "${IMAGE_TAG}" .

echo "Uploading image to server..."
docker save "${IMAGE_TAG}" | ssh "${SSH_HOST}" 'docker load'

echo "Restarting worker..."
ssh "${SSH_HOST}" "cd ${DEPLOY_PATH} && docker compose --env-file .env.prod -f docker-compose.prod.yml up -d worker"

echo "Done."
