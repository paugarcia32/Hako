import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../api/src/trpc/trpc.middleware';

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
