import { Module } from '@nestjs/common';
import { SCRAPER_STRATEGIES } from './interfaces/scraper.interface';
import { ScraperUtilsService } from './scraper-utils.service';
import { ScraperService } from './scraper.service';
import { DribbbleScraperService } from './strategies/dribbble.scraper';
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
    DribbbleScraperService,
    GenericScraperService,
    {
      provide: SCRAPER_STRATEGIES,
      // Order matters: specific scrapers first, generic fallback last.
      useFactory: (
        twitter: TwitterScraperService,
        pinterest: PinterestScraperService,
        youtube: YoutubeScraperService,
        dribbble: DribbbleScraperService,
        generic: GenericScraperService,
      ) => [twitter, pinterest, youtube, dribbble, generic],
      inject: [
        TwitterScraperService,
        PinterestScraperService,
        YoutubeScraperService,
        DribbbleScraperService,
        GenericScraperService,
      ],
    },
    ScraperService,
  ],
  exports: [ScraperService],
})
export class ScraperModule {}
