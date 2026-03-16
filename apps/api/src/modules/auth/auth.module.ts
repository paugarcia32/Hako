import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthMiddleware } from './auth.middleware';
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
