import type { ContentType } from '@inkbox/types';
import { Injectable } from '@nestjs/common';

type ScrapeResult = {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  content: string | null;
  author: string | null;
  siteName: string | null;
  type: ContentType;
};

@Injectable()
export class ScraperService {
  async scrape(url: string): Promise<ScrapeResult> {
    const type = this.detectType(url);
    // Scraping implementation will go here
    return {
      title: null,
      description: null,
      imageUrl: null,
      content: null,
      author: null,
      siteName: null,
      type,
    };
  }

  private detectType(url: string): ContentType {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'tweet';
    return 'article';
  }
}
