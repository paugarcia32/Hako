import {
  DribbbleScraperService,
  GenericScraperService,
  InstagramScraperService,
  PinterestScraperService,
  ScraperService,
  ScraperUtilsService,
  TikTokScraperService,
  TwitterScraperService,
  YoutubeScraperService,
  appRouter,
} from '@hako/trpc';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import type { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrpcMiddleware implements NestMiddleware {
  private readonly handler: ReturnType<typeof createExpressMiddleware>;
  private readonly scraperService: ScraperService;

  constructor(private readonly prisma: PrismaService) {
    const utils = new ScraperUtilsService();
    this.scraperService = new ScraperService([
      new TwitterScraperService(utils),
      new PinterestScraperService(utils),
      new YoutubeScraperService(utils),
      new DribbbleScraperService(utils),
      new TikTokScraperService(utils),
      new InstagramScraperService(utils),
      new GenericScraperService(utils),
    ]);

    this.handler = createExpressMiddleware({
      router: appRouter,
      createContext: ({ req }) => ({
        userId: (req as Request & { userId?: string }).userId ?? '',
        prisma: this.prisma,
        scraperService: this.scraperService,
        req: { ip: req.ip ?? null, headers: req.headers },
      }),
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.handler(req, res, next);
  }
}
