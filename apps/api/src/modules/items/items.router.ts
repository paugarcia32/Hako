import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { TrpcService } from '../../trpc/trpc.service';
import type { ItemsService } from './items.service';

@Injectable()
export class ItemsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly items: ItemsService,
  ) {}

  get router() {
    return this.trpc.router({
      list: this.trpc.protectedProcedure
        .input(
          z.object({
            limit: z.number().min(1).max(100).default(50),
            cursor: z.string().optional(),
          }),
        )
        .query(({ ctx, input }) => this.items.findAll(ctx.userId, input)),

      create: this.trpc.protectedProcedure
        .input(z.object({ url: z.string().url() }))
        .mutation(({ ctx, input }) => this.items.create(ctx.userId, input)),

      markAsRead: this.trpc.protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(({ ctx, input }) => this.items.markAsRead(ctx.userId, input.id)),

      toggleFavorite: this.trpc.protectedProcedure
        .input(z.object({ id: z.string(), isFavorite: z.boolean() }))
        .mutation(({ ctx, input }) =>
          this.items.toggleFavorite(ctx.userId, input.id, input.isFavorite),
        ),

      delete: this.trpc.protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(({ ctx, input }) => this.items.delete(ctx.userId, input.id)),
    });
  }
}
