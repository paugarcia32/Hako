import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsRouter } from './items.router';

@Module({
  providers: [ItemsService, ItemsRouter],
  exports: [ItemsRouter],
})
export class ItemsModule {}
