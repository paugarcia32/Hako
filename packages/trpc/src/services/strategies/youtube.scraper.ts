import { Logger } from '../../logger';
import type { ScraperUtilsService } from '../scraper-utils.service';
import { type IScraper, type ScrapeResult, emptyResult } from '../scraper.interface';

export class YoutubeScraperService implements IScraper {
  private readonly logger = new Logger(YoutubeScraperService.name);

  constructor(private readonly utils: ScraperUtilsService) {}

  canHandle(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  async scrape(url: string): Promise<ScrapeResult> {
    try {
      const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(oEmbedUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      });
      clearTimeout(timeout);

      this.logger.log(`YouTube oEmbed status for ${url}: ${response.status}`);

      if (response.ok) {
        const data = (await response.json()) as {
          title?: string;
          author_name?: string;
          thumbnail_url?: string;
        };

        const title = this.utils.sanitize(data.title ?? null);
        const author = this.utils.sanitize(data.author_name ?? null);
        const imageUrl = this.utils.sanitize(data.thumbnail_url ?? null);

        let description: string | null = null;
        try {
          const html = await this.utils.fetchHtml(url);
          if (html) {
            description = this.utils.sanitize(
              this.utils.extractMeta(html, 'og:description') ||
                this.utils.extractMeta(html, 'description'),
            );
          }
        } catch {
          // description stays null — non-fatal
        }

        if (title) {
          return {
            title,
            description,
            imageUrl,
            content: null,
            author,
            siteName: 'YouTube',
            type: 'video',
          };
        }
      } else {
        this.logger.warn(`YouTube oEmbed non-ok for ${url}: ${response.status}`);
      }
    } catch (err) {
      this.logger.warn(`YouTube oEmbed failed for ${url}: ${String(err)}`);
    }

    try {
      const html = await this.utils.fetchHtml(url);
      if (html) {
        const title = this.utils.sanitize(
          this.utils.extractMeta(html, 'og:title') || this.utils.extractTitle(html),
        );
        const description = this.utils.sanitize(
          this.utils.extractMeta(html, 'og:description') ||
            this.utils.extractMeta(html, 'description'),
        );
        const imageUrl = this.utils.sanitize(this.utils.extractMeta(html, 'og:image'));

        return {
          title,
          description,
          imageUrl,
          content: null,
          author: null,
          siteName: 'YouTube',
          type: 'video',
        };
      }
    } catch (err) {
      this.logger.warn(`YouTube HTML fallback failed for ${url}: ${String(err)}`);
    }

    return emptyResult('video');
  }
}
