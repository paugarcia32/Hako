import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AuthMiddleware } from './auth.middleware';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [AuthMiddleware, PrismaService],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/api/auth/*');
  }
}
