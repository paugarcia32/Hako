import { mergeRouters, router } from '../trpc';
import { collectionsRouter } from './collections.router';
import { itemsRouter } from './items.router';
import { sectionsRouter } from './sections.router';
import { usersRouter } from './users.router';

export const appRouter = mergeRouters(
  router({ items: itemsRouter }),
  router({ collections: collectionsRouter }),
  router({ sections: sectionsRouter }),
  router({ users: usersRouter }),
);

export type AppRouter = typeof appRouter;
