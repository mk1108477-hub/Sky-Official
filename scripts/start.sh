#!/bin/bash
set -e

# Kill any stale processes on our ports
fuser -k 5000/tcp 2>/dev/null || true
fuser -k 8080/tcp 2>/dev/null || true
fuser -k 24534/tcp 2>/dev/null || true

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

# Start frontend in foreground on port 5000
echo "[start] Starting frontend on port 5000..."
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/sky-official exec vite --config vite.config.ts --host 0.0.0.0 &
VITE_PID=$!

# Wait for Vite to be ready on port 5000
echo "[start] Waiting for frontend..."
for i in $(seq 1 30); do
  if fuser 5000/tcp >/dev/null 2>&1; then
    echo "[start] Frontend ready."
    break
  fi
  sleep 1
done

# Run TCP proxy: forward port 24534 -> 5000 to cover the original port mapping
echo "[start] Starting port 24534 -> 5000 forwarder..."
node scripts/proxy24534.mjs &
PROXY_PID=$!

# Wait for Vite to exit
wait $VITE_PID

# Cleanup
kill $API_PID $PROXY_PID 2>/dev/null || true
