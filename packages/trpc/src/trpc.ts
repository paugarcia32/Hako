import { TRPCError, initTRPC } from '@trpc/server';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import type { Context, PublicContext } from './context';

const t = initTRPC.context<Context>().create();
const tPublic = initTRPC.context<PublicContext>().create();

export const router = t.router;
export const mergeRouters = t.mergeRouters;

export const _protectedLimiter = new RateLimiterMemory({ points: 120, duration: 60 });
export const _scraperLimiter = new RateLimiterMemory({ points: 20, duration: 60 });
export const _publicLimiter = new RateLimiterMemory({ points: 30, duration: 60 });

export const publicProcedure = tPublic.procedure;

export const protectedProcedure = t.procedure
  .use(({ ctx, next }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({ ctx: { ...ctx, userId: ctx.userId } });
  })
  .use(async ({ ctx, next }) => {
    try {
      await _protectedLimiter.consume(ctx.userId);
    } catch (e) {
      if (e instanceof RateLimiterRes) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
      }
      throw e;
    }
    return next({ ctx });
  });

export const scraperProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  try {
    await _scraperLimiter.consume(ctx.userId);
  } catch (e) {
    if (e instanceof RateLimiterRes) {
      throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
    }
    throw e;
  }
  return next({ ctx });
});

export const publicRateLimitedProcedure = tPublic.procedure.use(async ({ ctx, next }) => {
  const key = ctx.req.ip ?? 'unknown';
  try {
    await _publicLimiter.consume(key);
  } catch (e) {
    if (e instanceof RateLimiterRes) {
      throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
    }
    throw e;
  }
  return next({ ctx });
});
