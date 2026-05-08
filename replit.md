# Sky Official

A Mobile Legends: Bang Bang (MLBB) diamond top-up storefront where users can purchase diamonds, passes, and boosting services with account verification and order tracking.

## Run & Operate

- Frontend runs on port 24534 (proxied to 3000 externally)
- API server runs on port 8080
- Both start automatically — no manual setup needed on new devices

## Required Secrets (only things needed on a new device)

- `ADMIN_PASSWORD` — password to access the admin panel at `/admin`
- `CLERK_PUBLISHABLE_KEY` — from your Clerk dashboard → API Keys
- `CLERK_SECRET_KEY` — from your Clerk dashboard → API Keys

All other environment variables (DATABASE_URL, PGHOST, etc.) are auto-provisioned by Replit.

## Stack

- pnpm workspaces, Node.js 20, TypeScript
- Frontend: React 19 + Vite + Tailwind CSS v4 + Wouter routing
- API: Express 5 + pg (raw SQL) on port 8080
- Auth: Clerk (frontend + backend)
- DB: Replit PostgreSQL — tables auto-created on first server start via `initDb()` in `artifacts/api-server/src/index.ts`
- Build: esbuild (ESM bundle)

## Where things live

- `artifacts/sky-official/src/App.tsx` — entire frontend app + routing
- `artifacts/sky-official/src/components/` — page components (AdminPanel, PackagesSection, PaymentPage, etc.)
- `artifacts/api-server/src/index.ts` — DB table bootstrap (`initDb`)
- `artifacts/api-server/src/routes/` — API routes (admin, orders, wallet, profile, verify)
- `artifacts/api-server/src/app.ts` — Express app + Clerk middleware
- `lib/db/` — Drizzle ORM setup (schema not yet populated; tables managed via raw SQL in initDb)

## Architecture decisions

- DB tables are created with raw SQL via `initDb()` on server startup (not Drizzle migrations), so no manual `db push` is needed
- Clerk auth is proxied through the backend at `/api/__clerk` so it works on `.replit.app` domains without custom DNS
- Admin routes use a simple `ADMIN_PASSWORD` bearer token (not Clerk) so the admin panel is accessible independently of user auth
- Frontend proxies `/api` to `localhost:8080` via Vite dev server config

## Self-Bootstrapping

When this project is opened on any new device or account:
1. `pnpm install` runs automatically if `node_modules` is missing (built into each `dev` script)
2. Database tables are created automatically on first API server start
3. The only manual step is adding the three secrets above

## User preferences

- Keep secrets out of code and `.replit` — use Replit's secret store only
- The project must be fully self-bootstrapping on new devices

## Gotchas

- Do NOT add `pnpm --filter db push` to post-merge — the Drizzle schema in `lib/db` is empty; tables are managed by raw SQL in `initDb()`
- `pnpm -w install` in dev scripts uses `-w` (workspace root flag) so it installs from the root `pnpm-lock.yaml`
