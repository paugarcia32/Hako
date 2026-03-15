import { Injectable, NestMiddleware } from '@nestjs/common';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { Request, Response, NextFunction } from 'express';
import { TrpcService } from './trpc.service';
import { ItemsRouter } from '../modules/items/items.router';
import { CollectionsRouter } from '../modules/collections/collections.router';

@Injectable()
export class TrpcMiddleware implements NestMiddleware {
  constructor(
    private readonly trpc: TrpcService,
    private readonly items: ItemsRouter,
    private readonly collections: CollectionsRouter,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const appRouter = this.trpc.mergeRouters(
      this.trpc.router({ items: this.items.router }),
      this.trpc.router({ collections: this.collections.router }),
    );

    fetchRequestHandler({
      endpoint: '/trpc',
      req: req as unknown as globalThis.Request,
      router: appRouter,
      createContext: () => ({
        userId: (req as Request & { userId?: string | undefined }).userId ?? '',
        req,
      }),
    })
      .then((response) => {
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.status(response.status);
        return response.text();
      })
      .then((body) => res.send(body))
      .catch(next);
  }
}
