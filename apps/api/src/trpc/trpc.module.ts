import { Global, Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { TrpcMiddleware } from './trpc.middleware';
import { ItemsModule } from '../modules/items/items.module';
import { CollectionsModule } from '../modules/collections/collections.module';

@Global()
@Module({
  imports: [ItemsModule, CollectionsModule],
  providers: [TrpcService, TrpcMiddleware],
  exports: [TrpcService],
})
export class TrpcModule {}
