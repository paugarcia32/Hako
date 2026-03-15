import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsRouter } from './items.router';
import { PrismaService } from '../../prisma/prisma.service';
import { TrpcService } from '../../trpc/trpc.service';

@Module({
  providers: [ItemsService, ItemsRouter, PrismaService, TrpcService],
  exports: [ItemsRouter],
})
export class ItemsModule {}
