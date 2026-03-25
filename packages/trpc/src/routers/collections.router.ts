import { z } from 'zod';
import { CollectionsService } from '../services/collections.service';
import { protectedProcedure, publicRateLimitedProcedure, router } from '../trpc';

export const collectionsRouter = router({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => new CollectionsService(ctx.prisma).getById(ctx.userId, input.id)),

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(({ ctx, input }) => new CollectionsService(ctx.prisma).findAll(ctx.userId, input)),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => new CollectionsService(ctx.prisma).create(ctx.userId, input)),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        color: z.string().optional(),
        icon: z.string().nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      new CollectionsService(ctx.prisma).update(ctx.userId, input.id, {
        name: input.name,
        color: input.color,
        icon: input.icon,
      }),
    ),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), deleteItems: z.boolean() }))
    .mutation(({ ctx, input }) =>
      new CollectionsService(ctx.prisma).delete(ctx.userId, input.id, input.deleteItems),
    ),

  addItem: protectedProcedure
    .input(z.object({ collectionId: z.string(), itemId: z.string() }))
    .mutation(({ ctx, input }) =>
      new CollectionsService(ctx.prisma).addItem(ctx.userId, input.collectionId, input.itemId),
    ),

  removeItem: protectedProcedure
    .input(z.object({ collectionId: z.string(), itemId: z.string() }))
    .mutation(({ ctx, input }) =>
      new CollectionsService(ctx.prisma).removeItem(ctx.userId, input.collectionId, input.itemId),
    ),

  search: protectedProcedure
    .input(z.object({ query: z.string().min(1).max(100) }))
    .query(({ ctx, input }) => new CollectionsService(ctx.prisma).search(ctx.userId, input.query)),

  byShareToken: publicRateLimitedProcedure
    .input(
      z.object({
        token: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(({ ctx, input }) =>
      new CollectionsService(ctx.prisma).findByShareToken(input.token, {
        limit: input.limit,
        cursor: input.cursor,
      }),
    ),
});
