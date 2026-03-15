import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '../../trpc/trpc.service';
import { ItemsService } from './items.service';

@Injectable()
export class ItemsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly items: ItemsService,
  ) {}

  get router() {
    return this.trpc.router({
      list: this.trpc.protectedProcedure.query(({ ctx }) =>
        this.items.findAll(ctx.userId),
      ),

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
