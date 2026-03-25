import { z } from 'zod';
import { SectionsService } from '../services/sections.service';
import { protectedProcedure, router } from '../trpc';

export const sectionsRouter = router({
  list: protectedProcedure
    .input(z.object({ collectionId: z.string() }))
    .query(({ ctx, input }) =>
      new SectionsService(ctx.prisma).findAll(ctx.userId, input.collectionId),
    ),

  create: protectedProcedure
    .input(z.object({ collectionId: z.string(), name: z.string().min(1).max(100) }))
    .mutation(({ ctx, input }) =>
      new SectionsService(ctx.prisma).create(ctx.userId, input.collectionId, input.name),
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        order: z.number().int().min(0).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      new SectionsService(ctx.prisma).update(ctx.userId, input.id, {
        name: input.name,
        order: input.order,
      }),
    ),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => new SectionsService(ctx.prisma).delete(ctx.userId, input.id)),

  assignItem: protectedProcedure
    .input(
      z.object({
        collectionId: z.string(),
        itemId: z.string(),
        sectionId: z.string().nullable(),
      }),
    )
    .mutation(({ ctx, input }) =>
      new SectionsService(ctx.prisma).assignItem(
        ctx.userId,
        input.collectionId,
        input.itemId,
        input.sectionId,
      ),
    ),

  reorder: protectedProcedure
    .input(z.object({ collectionId: z.string(), orderedIds: z.array(z.string()) }))
    .mutation(({ ctx, input }) =>
      new SectionsService(ctx.prisma).reorder(ctx.userId, input.collectionId, input.orderedIds),
    ),
});
