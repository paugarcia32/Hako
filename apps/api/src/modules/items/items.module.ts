import { Module } from '@nestjs/common';
import { ItemsRouter } from './items.router';
import { ItemsService } from './items.service';

@Module({
  providers: [ItemsService, ItemsRouter],
  exports: [ItemsRouter],
})
export class ItemsModule {}
