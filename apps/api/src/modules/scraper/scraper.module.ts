import { Module } from '@nestjs/common';
import { SCRAPER_STRATEGIES } from './interfaces/scraper.interface';
import { ScraperUtilsService } from './scraper-utils.service';
import { ScraperService } from './scraper.service';
import { GenericScraperService } from './strategies/generic.scraper';
import { PinterestScraperService } from './strategies/pinterest.scraper';
import { TwitterScraperService } from './strategies/twitter.scraper';
import { YoutubeScraperService } from './strategies/youtube.scraper';

@Module({
  providers: [
    ScraperUtilsService,
    TwitterScraperService,
    PinterestScraperService,
    YoutubeScraperService,
    GenericScraperService,
    {
      provide: SCRAPER_STRATEGIES,
      // Order matters: specific scrapers first, generic fallback last.
      useFactory: (
        twitter: TwitterScraperService,
        pinterest: PinterestScraperService,
        youtube: YoutubeScraperService,
        generic: GenericScraperService,
      ) => [twitter, pinterest, youtube, generic],
      inject: [
        TwitterScraperService,
        PinterestScraperService,
        YoutubeScraperService,
        GenericScraperService,
      ],
    },
    ScraperService,
  ],
  exports: [ScraperService],
})
export class ScraperModule {}
