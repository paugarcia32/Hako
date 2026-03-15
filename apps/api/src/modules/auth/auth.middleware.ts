import { Injectable, type NestMiddleware, type OnModuleInit } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
// biome-ignore lint/style/useImportType: needed for emitDecoratorMetadata
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware, OnModuleInit {
  private authHandler!: (req: Request, res: Response) => Promise<void>;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // TypeScript with module:CommonJS transforms `await import()` into `require()`,
    // which breaks ESM-only packages like better-auth. Using `new Function` bypasses
    // that transformation while preserving type safety via type-only imports.
    const esmImport = new Function('m', 'return import(m)') as <T>(m: string) => Promise<T>;

    const { betterAuth } = await esmImport<typeof import('better-auth')>('better-auth');
    const { toNodeHandler } = await esmImport<typeof import('better-auth/node')>('better-auth/node');
    const { prismaAdapter } = await esmImport<typeof import('better-auth/adapters/prisma')>('better-auth/adapters/prisma');

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
