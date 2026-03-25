# hako

Personal reading inbox. Save URLs, read later, organize in collections.

## Stack

| Layer | Tech |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Web | Next.js 15 (App Router) |
| API | NestJS 10 (thin HTTP adapter) |
| Business logic | `@hako/trpc` — tRPC 11 + plain TypeScript services |
| Auth | better-auth |
| ORM | Prisma 5 + PostgreSQL |
| Linter / Formatter | Biome |

## Structure

```
hako/
├── apps/
│   ├── web/          # Next.js — http://localhost:3000
│   └── api/          # NestJS — http://localhost:3001
├── packages/
│   ├── trpc/         # @hako/trpc — all business logic, tRPC routers and services
│   ├── types/        # @hako/types — shared TypeScript types
│   ├── utils/        # @hako/utils — shared utilities
│   └── config/       # @hako/config — base tsconfig/biome
├── biome.json
└── turbo.json
```

All domain logic (routers, services, scraper strategies) lives in `packages/trpc` as framework-agnostic TypeScript. `apps/api` is a thin NestJS adapter that mounts the tRPC handler and handles auth. See [`docs/architecture.md`](docs/architecture.md) for details.

## Prerequisites

- [Node.js](https://nodejs.org) >= 22
- [pnpm](https://pnpm.io) >= 9 — `npm install -g pnpm`
- PostgreSQL (see options below)

### Infrastructure options

**Option A — Docker**
```bash
docker compose up -d
```

**Option B — Cloud (no local install needed)**

1. Create a free PostgreSQL DB at [neon.tech](https://neon.tech)
2. Copy the connection string into `apps/api/.env`

**Option C — Native (Windows)**
```powershell
winget install PostgreSQL.PostgreSQL
```

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Edit both files with your DB credentials

# 3. Push the database schema
cd apps/api && pnpm db:push && cd ../..

# 4. Start everything
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001

## Scripts

### Root (runs across all apps/packages via Turborepo)

```bash
pnpm dev          # Start all apps in watch mode
pnpm build        # Build all packages and apps
pnpm typecheck    # tsc --noEmit across the monorepo
pnpm lint         # Biome lint check
pnpm format       # Biome format (writes changes)
pnpm test         # Run all test suites
```

### `packages/trpc`

```bash
pnpm --filter @hako/trpc test              # Run tests (requires .env.test)
pnpm --filter @hako/trpc test:watch        # Watch mode
pnpm --filter @hako/trpc test:coverage     # With coverage report
pnpm --filter @hako/trpc build             # Compile to dist/
```

### `apps/api`

```bash
pnpm --filter @hako/api dev          # NestJS watch mode
pnpm --filter @hako/api build        # Compile to dist/
pnpm --filter @hako/api typecheck    # Type check without emitting

pnpm --filter @hako/api db:push           # Push schema to DB (dev)
pnpm --filter @hako/api db:migrate        # Create and apply a migration
pnpm --filter @hako/api db:migrate:test   # Push schema to test DB
pnpm --filter @hako/api db:studio         # Prisma Studio at http://localhost:5555
```

### `apps/web`

```bash
pnpm --filter @hako/web dev          # Next.js with Turbopack
pnpm --filter @hako/web build        # Production build
pnpm --filter @hako/web typecheck    # Type check without emitting
```

## Database

Schema is defined in `apps/api/prisma/schema.prisma`.

```bash
# Iterate on schema during development (no migration files)
pnpm --filter @hako/api db:push

# Create a named migration (staging/production)
pnpm --filter @hako/api db:migrate

# Explore data visually
pnpm --filter @hako/api db:studio
```

## Tests

Tests live in `packages/trpc/src/` alongside the source files they test (`*.spec.ts`). They use **Vitest** with a real PostgreSQL test database — no mocks for DB operations.

### First-time setup

Create the test database and push the schema:

```bash
cd apps/api && pnpm db:migrate:test
```

Requires `apps/api/.env.test` to be configured (defaults to `postgres:password@localhost:5432/hako_test`).

### Running tests

```bash
# From the repo root — runs all test suites via Turborepo
pnpm test

# trpc package only
pnpm --filter @hako/trpc test          # Run once (CI mode)
pnpm --filter @hako/trpc test:watch    # Watch mode
pnpm --filter @hako/trpc test:coverage # With coverage report
```

### What's tested

| File | Type | Description |
|---|---|---|
| `src/trpc.spec.ts` | Unit | Rate limiting middleware |
| `src/services/items.service.spec.ts` | Integration | All ItemsService DB operations |
| `src/services/collections.service.spec.ts` | Integration | CollectionsService DB operations |
| `src/services/sections.service.spec.ts` | Integration | SectionsService DB operations |
| `src/services/users.service.spec.ts` | Integration | UsersService DB operations |
| `src/services/scraper.service.spec.ts` | Unit | Scraper orchestrator (strategy routing) |
| `src/services/strategies/*.spec.ts` | Unit | Per-platform scraper strategies |
| `src/routers/items.router.spec.ts` | tRPC | Items procedures — auth, validation, business logic |
| `src/routers/collections.router.spec.ts` | tRPC | Collections procedures — auth, public routes |
| `src/routers/sections.router.spec.ts` | tRPC | Sections procedures — auth, ordering |
| `src/routers/users.router.spec.ts` | tRPC | Users procedures — auth, account deletion |

tRPC procedures are tested using `appRouter.createCaller(ctx)` — no HTTP server needed.

## Environment variables

### `apps/api/.env`

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | API port (default `3001`) |
| `BETTER_AUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Full URL of the API (e.g. `http://localhost:3001`) |
| `WEB_ORIGIN` | Web app origin for CORS (e.g. `http://localhost:3000`) |
| `GITHUB_CLIENT_ID` | GitHub OAuth (optional) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth (optional) |
| `GOOGLE_CLIENT_ID` | Google OAuth (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth (optional) |

### `apps/web/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL of the API (e.g. `http://localhost:3001`) |
| `BETTER_AUTH_URL` | Full URL of the web app (e.g. `http://localhost:3000`) |
| `BETTER_AUTH_SECRET` | Same secret as the API |

## Adding a new tRPC procedure

1. Add the method to the service in `packages/trpc/src/services/<domain>.service.ts`
2. Expose it in the router in `packages/trpc/src/routers/<domain>.router.ts`
3. The type is automatically available in the web via `import type { AppRouter } from '@hako/trpc'`

## Code style

Biome handles both linting and formatting. No ESLint, no Prettier.

```bash
pnpm lint      # Check for issues
pnpm format    # Fix formatting
```

Configuration: `biome.json` at the root.
