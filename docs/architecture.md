# Architecture

## Monorepo structure

```
hako/
├── apps/
│   ├── api/          # NestJS backend (@hako/api)
│   └── web/          # Next.js 15 frontend (@hako/web)
├── packages/
│   ├── types/        # Shared TypeScript types (@hako/types)
│   ├── utils/        # Shared utilities (@hako/utils)
│   └── config/       # Shared tsconfig and tool configs (@hako/config)
└── docs/
    ├── architecture.md
    ├── design-system.md
    └── improvements/  # Scalability issues backlog
```

Managed with **pnpm workspaces** + **Turborepo**. Run all apps with `pnpm dev` from root.

---

## Backend — `apps/api`

**Stack**: NestJS 10 + tRPC 11 + Prisma 5 + PostgreSQL + better-auth 1

### Request flow

```
HTTP request
  → Express (NestJS adapter)
  → SessionMiddleware  (extracts userId from better-auth session cookie)
  → ThrottlerGuard     (60 req/min in prod, per IP)
  → /api/auth/*        → AuthMiddleware → better-auth handler
  → /trpc/*            → TrpcMiddleware → tRPC router
```

### Module layout

```
src/
├── modules/
│   ├── auth/         # better-auth init, session & auth middlewares
│   ├── items/        # Items CRUD + scraping trigger
│   ├── collections/  # Collections + sections + sharing
│   ├── sections/     # Section ordering (dnd-kit backend)
│   ├── users/        # Profile update, account deletion
│   └── scraper/      # URL metadata extraction (strategy pattern)
│       └── strategies/  # generic, youtube, twitter, pinterest, dribbble
├── prisma/           # PrismaService (global module)
└── trpc/             # tRPC init, AppRouter assembly, Express middleware
```

### tRPC procedures

- `protectedProcedure` — requires authenticated session (`userId` in context)
- `publicProcedure` — unauthenticated (only `collections.byShareToken`)

All inputs validated with Zod. All service methods verify `userId` ownership before mutations.

### Scraper

When an item is created, `ScraperService` dispatches to the appropriate strategy by hostname. Strategies implement a common interface: fetch metadata, return normalized `ItemMetadata`. Each request is capped at 10s timeout / 500KB response.

### Database

See `apps/api/prisma/schema.prisma` for the full schema. Key relations:
- `Item` → `CollectionItem[]` → `Collection` (many-to-many with optional `CollectionSection`)
- All user data cascades on user delete

Existing indexes: `userId`, `userId+status` on items; `userId`, `shareToken` on collections.

---

## Frontend — `apps/web`

**Stack**: Next.js 15 (App Router, Turbopack) + React 19 + tRPC client + React Query 5 + Tailwind 4

### Data flow

```
Page component
  → trpc.<router>.<procedure>.useQuery / useInfiniteQuery
  → React Query (staleTime: 60s, gcTime: 5min)
  → httpBatchLink → POST /trpc (batched)
  → Backend
```

The tRPC client is typed end-to-end: `apps/web/src/server/trpc.ts` imports `AppRouter` directly from the API source (not a generated artifact). This import is a cross-app reference — it only carries types, no runtime code.

### App structure

```
src/app/
├── layout.tsx              # Root layout (theme script, fonts)
├── (auth)/                 # Login, register (no sidebar)
├── (app)/
│   ├── layout.tsx          # TrpcProvider + KeyboardNavProvider + TopBar
│   ├── inbox/              # Non-archived items with no collection
│   ├── all/                # All items with archive toggle
│   ├── archive/            # Archived items
│   ├── collections/        # Collection grid
│   ├── collections/[id]/   # Collection detail with sections
│   └── settings/           # Profile, account deletion
└── share/[token]/          # Public collection view (unauthenticated)
```

### Key patterns

**Infinite scroll**: `useInfiniteItems` hook wraps `trpc.items.list.useInfiniteQuery` with cursor-based pagination (50 items/page). `ScrollSentinel` uses IntersectionObserver with 200px rootMargin to trigger the next page.

**Item actions**: `useItemActions` centralizes archive/unarchive/delete mutations with `utils.invalidate()` + `refetch()` for cache coherence.

**Keyboard navigation**: `KeyboardNavProvider` manages focus state. `useVimKeyboard` handles vim-style bindings (j/k navigation, g-prefix chords, f-prefix filter chords).

**Drag-and-drop**: dnd-kit in `SectionedItemList` for reordering sections. Items use `forwardRef` + merged refs to satisfy both dnd-kit and ItemRow's own ref needs.

**React Compiler**: enabled experimentally — handles most memoization automatically.
