import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { ItemsModule } from './modules/items/items.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { TrpcModule } from './trpc/trpc.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ItemsModule,
    CollectionsModule,
    ScraperModule,
    TrpcModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
