import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { ItemsModule } from './modules/items/items.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { PrismaModule } from './prisma/prisma.module';
import { TrpcModule } from './trpc/trpc.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: process.env.NODE_ENV === 'production' ? 60 : 300,
      },
    ]),
    PrismaModule,
    AuthModule,
    ItemsModule,
    CollectionsModule,
    ScraperModule,
    TrpcModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
