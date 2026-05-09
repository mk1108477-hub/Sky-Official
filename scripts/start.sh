#!/bin/bash
set -e

# Kill any stale processes on our ports
fuser -k 5000/tcp 2>/dev/null || true
fuser -k 8080/tcp 2>/dev/null || true

# Install deps once at the root
pnpm -w install

# Start API server in background
echo "[start] Starting API server on port 8080..."
PORT=8080 pnpm --filter @workspace/api-server run build
PORT=8080 NODE_ENV=development node --enable-source-maps artifacts/api-server/dist/index.mjs &
API_PID=$!

# Wait for API server to be ready
echo "[start] Waiting for API server..."
for i in $(seq 1 30); do
  if fuser 8080/tcp >/dev/null 2>&1; then
    echo "[start] API server ready."
    break
  fi
  sleep 1
done

# Start frontend in foreground
echo "[start] Starting frontend on port 5000..."
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/sky-official exec vite --config vite.config.ts --host 0.0.0.0

# If frontend exits, kill API server too
kill $API_PID 2>/dev/null || true
