import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '../../trpc/trpc.service';
import { CollectionsService } from './collections.service';

@Injectable()
export class CollectionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly collections: CollectionsService,
  ) {}

  get router() {
    return this.trpc.router({
      list: this.trpc.protectedProcedure
        .input(z.object({ limit: z.number().min(1).max(100).default(50), cursor: z.string().optional() }))
        .query(({ ctx, input }) => this.collections.findAll(ctx.userId, input)),

      create: this.trpc.protectedProcedure
        .input(
          z.object({
            name: z.string().min(1),
            description: z.string().optional(),
          }),
        )
        .mutation(({ ctx, input }) => this.collections.create(ctx.userId, input)),

      addItem: this.trpc.protectedProcedure
        .input(z.object({ collectionId: z.string(), itemId: z.string() }))
        .mutation(({ ctx, input }) =>
          this.collections.addItem(ctx.userId, input.collectionId, input.itemId),
        ),

      byShareToken: this.trpc.publicProcedure
        .input(z.object({ token: z.string() }))
        .query(({ input }) => this.collections.findByShareToken(input.token)),
    });
  }
}
