#!/bin/bash
set -e

cleanup() {
  kill "$API_PID" 2>/dev/null || true
  exit 0
}
trap cleanup TERM INT

# Install deps once at the root
pnpm -w install

# Build API server
echo "[api] Building API server..."
pnpm --filter @workspace/api-server run build

# Kill anything still running on port 8080
echo "[api] Freeing port 8080..."
fuser -k 8080/tcp 2>/dev/null || true
sleep 1

# Start API server
echo "[api] Starting API server on port 8080..."
PORT=8080 NODE_ENV=development node --enable-source-maps artifacts/api-server/dist/index.mjs &
API_PID=$!

echo "[api] Waiting for API server..."
for i in $(seq 1 30); do
  curl -s http://localhost:8080/ >/dev/null 2>&1 && echo "[api] API server ready." && break
  sleep 1
done

wait $API_PID
