import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { TrpcMiddleware } from './trpc.middleware';

@Module({
  providers: [TrpcMiddleware],
})
export class TrpcModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TrpcMiddleware).forRoutes('/trpc');
  }
}
