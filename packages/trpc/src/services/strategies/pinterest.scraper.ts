import { Logger } from '../../logger';
import type { ScraperUtilsService } from '../scraper-utils.service';
import type { IScraper, ScrapeResult } from '../scraper.interface';

export class PinterestScraperService implements IScraper {
  private readonly logger = new Logger(PinterestScraperService.name);

  constructor(private readonly utils: ScraperUtilsService) {}

  canHandle(url: string): boolean {
    return url.includes('pinterest.com') || url.includes('pin.it');
  }

  async scrape(url: string): Promise<ScrapeResult> {
    const type = 'image' as const;
    const siteName = 'Pinterest';

    let title: string | null = null;
    let imageUrl: string | null = null;
    let author: string | null = null;

    try {
      const oEmbedUrl = `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(oEmbedUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = (await response.json()) as {
          title?: string;
          author_name?: string;
          thumbnail_url?: string;
        };
        title = data.title || null;
        author = data.author_name || null;
        imageUrl = data.thumbnail_url || null;
      }
    } catch (err) {
      this.logger.warn(`Pinterest oEmbed failed for ${url}: ${String(err)}`);
    }

    let description: string | null = null;

    try {
      const html = await this.utils.fetchHtml(url);
      if (html) {
        description =
          this.utils.extractMeta(html, 'og:description') ||
          this.utils.extractMeta(html, 'twitter:description') ||
          this.utils.extractMeta(html, 'description');

        if (!title) {
          title =
            this.utils.extractMeta(html, 'og:title') ||
            this.utils.extractMeta(html, 'twitter:title') ||
            this.utils.extractTitle(html);
        }
      }
    } catch (err) {
      this.logger.warn(`Pinterest HTML fetch failed for ${url}: ${String(err)}`);
    }

    if (!title) {
      try {
        title = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        /* keep null */
      }
    }

    return {
      title: this.utils.sanitize(title),
      description: this.utils.sanitize(description),
      imageUrl: this.utils.sanitize(imageUrl),
      content: null,
      author: this.utils.sanitize(author),
      siteName,
      type,
    };
  }
}
