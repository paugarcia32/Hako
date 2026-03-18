import { Injectable, Logger } from '@nestjs/common';
import type { IScraper, ScrapeResult } from '../interfaces/scraper.interface';
import { ScraperUtilsService } from '../scraper-utils.service';

@Injectable()
export class DribbbleScraperService implements IScraper {
  private readonly logger = new Logger(DribbbleScraperService.name);

  constructor(private readonly utils: ScraperUtilsService) {}

  canHandle(url: string): boolean {
    return url.includes('dribbble.com');
  }

  async scrape(url: string): Promise<ScrapeResult> {
    // Phase 1: HTML scraping — Dribbble has no oEmbed endpoint.
    // og:title is already the clean shot title (no author suffix).
    // The <title> tag has "Shot Title by Author on Dribbble" — used to extract the author.
    // NOTE: Dribbble is protected by AWS WAF; bot requests receive a ~2 KB JS challenge
    // page with no og:* data. We detect this and fall through to the slug fallback.
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
          type: 'dribbble',
        };
      }
    } catch (err) {
      this.logger.warn(`Dribbble HTML fetch failed for ${url}: ${String(err)}`);
    }

    // Phase 2: URL slug fallback — extracts a human-readable title from the URL
    // (e.g. "25614963-Duwy-Personal-Portfolio-Website" → "Duwy Personal Portfolio Website").
    return this.slugFallback(url);
  }

  /**
   * Detects an AWS WAF JS-challenge page served instead of the real HTML.
   * Challenge pages are tiny (~2 KB) and contain the WAF bootstrap marker.
   */
  isWafChallenge(html: string): boolean {
    return html.length < 10_000 && html.includes('awsWafCookieDomainList');
  }

  /**
   * Extracts a readable title from the shot slug in the URL.
   * "https://dribbble.com/shots/12345678-My-Shot-Title" → "My Shot Title"
   */
  extractTitleFromSlug(url: string): string | null {
    const match = url.match(/\/shots\/\d+-(.+?)(?:\/|\?|#|$)/);
    if (!match?.[1]) return null;
    return match[1].replace(/-/g, ' ');
  }

  /**
   * Extracts the author from Dribbble's <title> tag format:
   * "Shot Title by Author [for Team] on Dribbble"
   *
   * Uses og:title (the clean shot title) to strip the title prefix precisely,
   * then removes the " by " leader from the remainder.
   */
  extractAuthor(pageTitle: string | null, ogTitle: string | null): string | null {
    if (!pageTitle) return null;

    // Strip " on Dribbble" suffix
    const withoutSite = pageTitle.replace(/\s+on\s+Dribbble\s*$/i, '').trim();

    // If we have og:title, use it to isolate the " by Author" suffix precisely
    if (ogTitle && withoutSite.startsWith(ogTitle)) {
      const rest = withoutSite.slice(ogTitle.length).trim();
      // rest = "by Author for Team" or "by Author"
      return this.utils.sanitize(rest.replace(/^by\s+/i, '').trim()) || null;
    }

    // Fallback: match last " by Author" segment (greedy — handles titles containing "by")
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
      type: 'dribbble',
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
