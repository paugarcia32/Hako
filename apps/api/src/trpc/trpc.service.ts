import { Injectable } from '@nestjs/common';
import { TRPCError, initTRPC } from '@trpc/server';

type AppRequest = {
  headers: Record<string, string | string[] | undefined>;
  userId?: string;
};

type Context = {
  userId: string;
  req: AppRequest;
};

type PublicContext = {
  userId: string | null;
  req: AppRequest;
};

const t = initTRPC.context<Context>().create();
const tPublic = initTRPC.context<PublicContext>().create();

@Injectable()
export class TrpcService {
  router = t.router;
  mergeRouters = t.mergeRouters;

  publicProcedure = tPublic.procedure;

  protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({ ctx: { ...ctx, userId: ctx.userId } });
  });
}

export type AppRouter = ReturnType<TrpcService['router']>;
