import { type MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthMiddleware } from './auth.middleware';
import { AuthService } from './auth.service';
import { SessionMiddleware } from './session.middleware';

@Module({
  providers: [AuthService, AuthMiddleware, SessionMiddleware],
  exports: [AuthService],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/api/auth/*');
    consumer.apply(SessionMiddleware).forRoutes('/trpc');
  }
}
