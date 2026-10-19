# Kresliarska

Shared lobbies around a collaborative canvas: notes, sketches, live presence, and in-place mini-games.

## Prerequisites

- Node.js (version in `.node-version`)
- pnpm (version in `package.json` → `packageManager`)

## Install

```powershell
pnpm install
```

## Run (local dev)

```powershell
pnpm dev
```

- API — `http://localhost:3000`. Optional env: copy `apps/api/.env.example` to `apps/api/.env`.
- Web — `http://localhost:5173` (proxies `/api` to the API).

Or separately: `pnpm dev:api`, `pnpm dev:web`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | API + web in parallel |
| `pnpm check` | Typecheck + lint + build (turbo) |
| `pnpm verify` | Full CI locally — run before commit |
| `pnpm test` / `pnpm test:coverage` | Vitest (shared, api, web) |
| `pnpm lint` / `pnpm lint:fix` | Biome check / fix |
| `pnpm knip` | Unused exports and dependencies |

## Layout

```
apps/api          # NestJS API
apps/web          # React + Vite + Tailwind
packages/shared   # Shared Zod contracts and route constants
```
