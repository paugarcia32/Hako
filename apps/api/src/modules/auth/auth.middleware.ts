import { Injectable, type NestMiddleware, type OnModuleInit } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
// biome-ignore lint/style/useImportType: needed for emitDecoratorMetadata
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware, OnModuleInit {
  private authHandler!: (req: Request, res: Response) => Promise<void>;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const { betterAuth } = await import('better-auth');
    const { toNodeHandler } = await import('better-auth/node');
    const { prismaAdapter } = await import('better-auth/adapters/prisma');

    const auth = betterAuth({
      database: prismaAdapter(this.prisma, { provider: 'postgresql' }),
      secret: process.env.BETTER_AUTH_SECRET,
      baseURL: process.env.BETTER_AUTH_URL,
    });
    this.authHandler = toNodeHandler(auth);
  }

  async use(req: Request, res: Response, next: NextFunction) {
    await this.authHandler(req, res);
    next();
  }
}
