import { Module } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CollectionsRouter } from './collections.router';

@Module({
  providers: [CollectionsService, CollectionsRouter],
  exports: [CollectionsRouter],
})
export class CollectionsModule {}
