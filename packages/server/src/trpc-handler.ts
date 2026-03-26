import { appRouter } from '@hako/trpc';
import { trpcServer } from '@hono/trpc-server';
import { auth } from './auth.js';
import { prisma } from './db.js';
import { scraperService } from './scraper.js';

export const trpcHandler = trpcServer({
  router: appRouter,
  createContext: async (_opts, c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers }).catch(() => null);
    const userId = session?.user?.id ?? '';
    const ip = c.req.header('x-forwarded-for') ?? null;
    const headers: Record<string, string | string[] | undefined> = {};
    c.req.raw.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return { userId, prisma, scraperService, req: { ip, headers } };
  },
});
