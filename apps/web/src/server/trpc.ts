import type { AppRouter } from '@hako/trpc';
import { createTRPCClient, httpBatchLink } from '@trpc/client';

export type { AppRouter };

export const trpcServer = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/trpc`,
      fetch: (url, options) => {
        const { signal, ...rest } = options ?? {};
        return fetch(url, { ...rest, signal: signal ?? null, credentials: 'include' });
      },
    }),
  ],
});
