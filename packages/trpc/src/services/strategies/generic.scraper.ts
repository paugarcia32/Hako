import type { ContentType } from '@hako/types';
import { Logger } from '../../logger';
import type { ScraperUtilsService } from '../scraper-utils.service';
import { type IScraper, type ScrapeResult, emptyResult } from '../scraper.interface';

export class GenericScraperService implements IScraper {
  private readonly logger = new Logger(GenericScraperService.name);

  constructor(private readonly utils: ScraperUtilsService) {}

  canHandle(_url: string): boolean {
    return true;
  }

  async scrape(url: string): Promise<ScrapeResult> {
    const type = this.detectType(url);

    try {
      const html = await this.utils.fetchHtml(url);
      if (!html) return emptyResult(type);

      const title =
        this.utils.extractMeta(html, 'og:title') ||
        this.utils.extractMeta(html, 'twitter:title') ||
        this.utils.extractTitle(html);

      const description =
        this.utils.extractMeta(html, 'og:description') ||
        this.utils.extractMeta(html, 'twitter:description') ||
        this.utils.extractMeta(html, 'description');

      const imageUrl =
        this.utils.extractMeta(html, 'og:image') || this.utils.extractMeta(html, 'twitter:image');

      const siteName = this.utils.extractMeta(html, 'og:site_name');

      return {
        title: this.utils.sanitize(title),
        description: this.utils.sanitize(description),
        imageUrl: this.utils.sanitize(imageUrl),
        content: null,
        author: null,
        siteName: this.utils.sanitize(siteName),
        type,
      };
    } catch (err) {
      this.logger.warn(`Failed to scrape ${url}: ${String(err)}`);
      return emptyResult(type);
    }
  }

  detectType(url: string): ContentType {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'video';
    return 'article';
  }
}
