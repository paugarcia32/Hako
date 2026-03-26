# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

### Development

```bash
pnpm dev              # Start all apps (api: :3001, web: :3000)
pnpm build            # Build all apps via Turborepo
pnpm typecheck        # Run tsc --noEmit across all apps
```

### Per-app / per-package

```bash
# tRPC package (business logic + tests)
pnpm --filter @hako/trpc test          # Vitest (requires packages/server/.env.test)
pnpm --filter @hako/trpc test:watch    # Watch mode
pnpm --filter @hako/trpc test:coverage
pnpm --filter @hako/trpc build         # Compile to dist/ (needed before server dev)

# Run a single test file
pnpm --filter @hako/trpc test -- path/to/file.spec.ts

# Server (API)
pnpm --filter @hako/server dev
pnpm --filter @hako/server build

# Web
pnpm --filter @hako/web dev
pnpm --filter @hako/web build
```

### Linting & formatting

```bash
pnpm lint             # biome check . (lint + format check)
pnpm format           # biome format --write . (auto-fix formatting)
```

**Always run `pnpm lint` and `pnpm typecheck` before finishing any task.** Fix all errors and warnings — `noUnusedVariables` and `noUnusedImports` are set to `error`.

### Database

```bash
# From packages/db/ (or delegate via packages/server/ — both work)
pnpm --filter @hako/db db:migrate       # prisma migrate dev (creates migration + applies)
pnpm --filter @hako/db db:push          # prisma db push (no migration file, dev only)
pnpm --filter @hako/db db:studio        # Prisma Studio UI
pnpm --filter @hako/db db:migrate:test  # Apply schema to test DB (uses .env.test)
pnpm --filter @hako/db generate         # Regenerate Prisma client after schema changes
```

Schema and migrations live in `packages/db/prisma/`. Requires `.env` in `packages/server/` — copy from `.env.example`. Test DB requires `.env.test`.

---

## Architecture

Full reference: [`docs/architecture.md`](docs/architecture.md)

**Monorepo**: pnpm workspaces + Turborepo. Six packages:
- `@hako/db` — Prisma schema, migrations, and generated client (single source of truth for DB)
- `@hako/trpc` — all business logic: tRPC routers, services, scraper strategies (framework-agnostic TypeScript)
- `@hako/server` — the API: Hono app + Node.js startup. CORS, rate limiting, auth, tRPC mounting
- `@hako/types` — shared TypeScript types
- `@hako/utils` — shared utilities
- `@hako/config` — shared tsconfig and tool configs (`base`, `nextjs`)

**Web** (`apps/web`): Next.js 15 App Router + React 19 + tRPC client + React Query 5 + Tailwind 4.

Imports `AppRouter` type from `@hako/trpc` — types only, no runtime coupling.

### Adding a new feature

1. **Backend**: Add the method to the service in `packages/trpc/src/services/<domain>.service.ts`. Expose it in the router in `packages/trpc/src/routers/<domain>.router.ts`. Use `protectedProcedure` for authenticated routes. Validate input with Zod. Add ownership checks in the service (`where: { id, userId }`).
2. **Frontend**: Call via `trpc.<router>.<procedure>.useQuery/useMutation`. Invalidate relevant queries in mutation `onSuccess`.
3. **Types**: If shared between apps, add to `packages/types/src/index.ts`.

### Auth

Sessions are cookie-based (better-auth). The `userId` is extracted from the session cookie per request in `@hako/server`'s tRPC context factory and injected into tRPC context. Protected procedures throw `UNAUTHORIZED` if `userId` is absent. **Never trust user-supplied IDs** — always scope DB queries with the `userId` from context.

---

## Code standards

### General

- Follow **SOLID** principles. Single responsibility per service/component. Depend on abstractions (interfaces, injected services).
- Prefer **explicit over implicit**: name things clearly, avoid magic numbers/strings (use enums or constants).
- **No premature abstraction**: three similar lines are better than a wrong abstraction. Only extract when there are 3+ real usages.
- Keep functions small and focused. If a function needs a comment to explain what it does, it should probably be split or renamed.

### `packages/trpc` (business logic)

- Services contain business logic; routers contain only input validation and service delegation.
- All DB access goes through the `PrismaClient` instance passed via context — never instantiate Prisma directly inside a service.
- Add tests for scraper strategies and any non-trivial service logic. Tests use Vitest and live alongside source files as `*.spec.ts` inside `packages/trpc/src/`.

### `packages/server` (API)

- Contains the Hono app (auth routing, tRPC mounting, CORS, rate limiting) and the Node.js startup (`serve` + Prisma lifecycle). No domain logic.
- ESM-native — imports `better-auth` as a direct static import (no `new Function` workaround).

### Frontend (React / Next.js)

- **Separate logic from UI strictly**: components in `src/components/` should only handle rendering and local interaction state. All data fetching, mutations, and derived state belong in hooks (`src/hooks/`). Pages are thin orchestrators that compose hooks and components — no business logic inline.
- A component that calls `trpc.*` directly or contains non-trivial derived state should be refactored: extract the logic into a hook, keep the component as a pure consumer.
- React Compiler is enabled — avoid manual `useMemo`/`useCallback` unless the Compiler can't handle a specific case.
- Use `type` imports (`import type { Foo }`) — enforced by Biome.
- Prefer server components where data fetching can happen without interactivity. Use `'use client'` only when necessary.

### Style

- Formatter: Biome with 2-space indent, single quotes, trailing commas, 100 char line width.
- `useImportType` is enforced everywhere — always use `import type` for type-only imports.

---

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — monorepo structure, request flow, module layout, data flow
- [`docs/design-system.md`](docs/design-system.md) — brand identity, colors, typography, component patterns, dark mode rules
