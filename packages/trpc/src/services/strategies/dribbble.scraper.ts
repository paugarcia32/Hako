import { Logger } from '../../logger';
import type { ScraperUtilsService } from '../scraper-utils.service';
import type { IScraper, ScrapeResult } from '../scraper.interface';

export class DribbbleScraperService implements IScraper {
  private readonly logger = new Logger(DribbbleScraperService.name);

  constructor(private readonly utils: ScraperUtilsService) {}

  canHandle(url: string): boolean {
    return url.includes('dribbble.com');
  }

  async scrape(url: string): Promise<ScrapeResult> {
    try {
      const html = await this.utils.fetchHtml(url);
      if (html) {
        if (this.isWafChallenge(html)) {
          this.logger.warn(`Dribbble WAF challenge received for ${url}, falling back to URL slug`);
          return this.slugFallback(url);
        }

        const ogTitle = this.utils.extractMeta(html, 'og:title');
        const pageTitle = this.utils.extractTitle(html);

        const title = this.utils.sanitize(
          ogTitle || this.utils.extractMeta(html, 'twitter:title') || pageTitle,
        );
        const author = this.extractAuthor(pageTitle, ogTitle);
        const description = this.utils.sanitize(
          this.utils.extractMeta(html, 'og:description') ||
            this.utils.extractMeta(html, 'description'),
        );
        const imageUrl = this.utils.sanitize(
          this.utils.extractMeta(html, 'og:image') || this.utils.extractMeta(html, 'twitter:image'),
        );

        return {
          title,
          description,
          imageUrl,
          content: null,
          author,
          siteName: 'Dribbble',
          type: 'image',
        };
      }
    } catch (err) {
      this.logger.warn(`Dribbble HTML fetch failed for ${url}: ${String(err)}`);
    }

    return this.slugFallback(url);
  }

  isWafChallenge(html: string): boolean {
    return html.length < 10_000 && html.includes('awsWafCookieDomainList');
  }

  extractTitleFromSlug(url: string): string | null {
    const match = url.match(/\/shots\/\d+-(.+?)(?:\/|\?|#|$)/);
    if (!match?.[1]) return null;
    return match[1].replace(/-/g, ' ');
  }

  extractAuthor(pageTitle: string | null, ogTitle: string | null): string | null {
    if (!pageTitle) return null;

    const withoutSite = pageTitle.replace(/\s+on\s+Dribbble\s*$/i, '').trim();

    if (ogTitle && withoutSite.startsWith(ogTitle)) {
      const rest = withoutSite.slice(ogTitle.length).trim();
      return this.utils.sanitize(rest.replace(/^by\s+/i, '').trim()) || null;
    }

    const match = withoutSite.match(/^(?:.*)\s+by\s+(.+)$/i);
    return this.utils.sanitize(match?.[1] ?? null);
  }

  private slugFallback(url: string): ScrapeResult {
    const title = this.extractTitleFromSlug(url) ?? this.hostnameOf(url);
    return {
      title,
      description: null,
      imageUrl: null,
      content: null,
      author: null,
      siteName: 'Dribbble',
      type: 'image',
    };
  }

  private hostnameOf(url: string): string | null {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  }
}
