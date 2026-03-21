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

### Per-app

```bash
# API
pnpm --filter @hako/api dev
pnpm --filter @hako/api test          # Vitest (requires .env.test)
pnpm --filter @hako/api test:watch    # Watch mode
pnpm --filter @hako/api test:coverage

# Run a single test file
pnpm --filter @hako/api test -- path/to/file.spec.ts

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
# From apps/api/
pnpm db:migrate       # prisma migrate dev (creates migration + applies)
pnpm db:push          # prisma db push (no migration file, dev only)
pnpm db:studio        # Prisma Studio UI
pnpm db:migrate:test  # Apply schema to test DB (uses .env.test)
```

Requires `.env` in `apps/api/` — copy from `.env.example`. Test DB requires `.env.test`.

---

## Architecture

Full reference: [`docs/architecture.md`](docs/architecture.md)

**Monorepo**: pnpm workspaces + Turborepo. Three shared packages:
- `@hako/types` — shared TypeScript types (imported by both apps)
- `@hako/utils` — shared utility functions
- `@hako/config` — shared tsconfig and tool configs (`base`, `nextjs`, `nestjs`)

**API** (`apps/api`): NestJS + tRPC 11 + Prisma 5 + PostgreSQL + better-auth. All API surface is tRPC — no REST endpoints except `/api/auth/*` (handled by better-auth).

**Web** (`apps/web`): Next.js 15 App Router + React 19 + tRPC client + React Query 5 + Tailwind 4. The web app imports `AppRouter` type directly from API source (`apps/api/src/trpc/trpc.middleware.ts`) — types only, no runtime coupling.

### Adding a new feature

1. **Backend**: Create a new procedure in the relevant router (or a new module if the domain is distinct). Use `protectedProcedure` for authenticated routes. Validate input with Zod. Add ownership checks in the service (`where: { id, userId }`).
2. **Frontend**: Call via `trpc.<router>.<procedure>.useQuery/useMutation`. Invalidate relevant queries in mutation `onSuccess`.
3. **Types**: If shared between apps, add to `packages/types/src/index.ts`.

### Auth

Sessions are cookie-based (better-auth). The `userId` is injected into tRPC context by `SessionMiddleware`. Protected procedures throw `UNAUTHORIZED` if `userId` is absent. **Never trust user-supplied IDs** — always scope DB queries with the `userId` from context.

---

## Code standards

### General

- Follow **SOLID** principles. Single responsibility per service/component. Depend on abstractions (interfaces, injected services).
- Prefer **explicit over implicit**: name things clearly, avoid magic numbers/strings (use enums or constants).
- **No premature abstraction**: three similar lines are better than a wrong abstraction. Only extract when there are 3+ real usages.
- Keep functions small and focused. If a function needs a comment to explain what it does, it should probably be split or renamed.

### Backend (NestJS)

- One NestJS module per domain (items, collections, sections, users, scraper, auth).
- Services contain business logic; routers contain only input validation and service delegation.
- All DB access goes through `PrismaService` — never instantiate Prisma directly.
- Add tests for scraper strategies and any non-trivial service logic. Tests use Vitest and live alongside source files as `*.spec.ts`.

### Frontend (React / Next.js)

- **Separate logic from UI strictly**: components in `src/components/` should only handle rendering and local interaction state. All data fetching, mutations, and derived state belong in hooks (`src/hooks/`). Pages are thin orchestrators that compose hooks and components — no business logic inline.
- A component that calls `trpc.*` directly or contains non-trivial derived state should be refactored: extract the logic into a hook, keep the component as a pure consumer.
- React Compiler is enabled — avoid manual `useMemo`/`useCallback` unless the Compiler can't handle a specific case.
- Use `type` imports (`import type { Foo }`) — enforced by Biome.
- Prefer server components where data fetching can happen without interactivity. Use `'use client'` only when necessary.

### Style

- Formatter: Biome with 2-space indent, single quotes, trailing commas, 100 char line width.
- In the API (`apps/api/**`), `useImportType` is disabled to support NestJS decorator patterns — use regular imports.
- In the Web (`apps/web/**`), `useImportType` is enforced — always use `import type` for type-only imports.

---

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — monorepo structure, request flow, module layout, data flow
- [`docs/design-system.md`](docs/design-system.md) — brand identity, colors, typography, component patterns, dark mode rules
