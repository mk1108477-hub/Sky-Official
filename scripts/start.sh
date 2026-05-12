#!/bin/bash
set -e

# Kill background children when this script exits (SIGTERM from workflow manager)
cleanup() {
  kill "$API_PID" 2>/dev/null || true
  kill "$VITE_PID" 2>/dev/null || true
  exit 0
}
trap cleanup TERM INT

# Install deps once at the root (ensures all binaries like esbuild are present)
pnpm -w install

# Build API server
echo "[start] Building API server..."
cd artifacts/api-server && node ./build.mjs && cd ../..

# Kill anything still running on our ports
echo "[start] Freeing ports..."
pkill -9 -f "dist/index.mjs" 2>/dev/null || true
sleep 3

# Start API server in background
echo "[start] Starting API server on port 8080..."
PORT=8080 NODE_ENV=development node --enable-source-maps artifacts/api-server/dist/index.mjs &
API_PID=$!

# Wait for API server
echo "[start] Waiting for API server..."
for i in $(seq 1 30); do
  curl -s http://localhost:8080/ >/dev/null 2>&1 && echo "[start] API server ready." && break
  sleep 1
done

# Start frontend on port 5000
echo "[start] Starting frontend on port 5000..."
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/sky-official exec vite --config vite.config.ts --host 0.0.0.0 &
VITE_PID=$!

# Wait for frontend
echo "[start] Waiting for frontend..."
for i in $(seq 1 60); do
  curl -s http://localhost:5000/ >/dev/null 2>&1 && echo "[start] Frontend ready." && break
  sleep 1
done

# Wait for Vite to exit
wait $VITE_PID
