import { Module } from '@nestjs/common';
import { CollectionsRouter } from './collections.router';
import { CollectionsService } from './collections.service';

@Module({
  providers: [CollectionsService, CollectionsRouter],
  exports: [CollectionsRouter],
})
export class CollectionsModule {}
