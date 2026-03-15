import { Module } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CollectionsRouter } from './collections.router';
import { PrismaService } from '../../prisma/prisma.service';
import { TrpcService } from '../../trpc/trpc.service';

@Module({
  providers: [CollectionsService, CollectionsRouter, PrismaService, TrpcService],
  exports: [CollectionsRouter],
})
export class CollectionsModule {}
