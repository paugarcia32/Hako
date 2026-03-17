import type { ContentType } from '@inkbox/types';
import { Injectable, Logger } from '@nestjs/common';

type ScrapeResult = {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  content: string | null;
  author: string | null;
  siteName: string | null;
  type: ContentType;
};

/** Trims a string and returns null if the result is empty or whitespace-only. */
function sanitize(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  async scrape(url: string): Promise<ScrapeResult> {
    const type = this.detectType(url);

    if (type === 'pinterest') {
      return this.scrapePinterest(url);
    }

    if (type === 'tweet') {
      return this.scrapeTwitter(url);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; Inkbox/1.0; +https://inkbox.app)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return this.empty(type);
      }

      // Read at most 500 KB to avoid downloading huge pages
      const reader = response.body?.getReader();
      if (!reader) return this.empty(type);

      const chunks: Uint8Array[] = [];
      let totalBytes = 0;
      const maxBytes = 500_000;

      while (true) {
        const { done, value } = await reader.read();
        if (done || !value) break;
        chunks.push(value);
        totalBytes += value.byteLength;
        if (totalBytes >= maxBytes) {
          await reader.cancel();
          break;
        }
      }

      const html = new TextDecoder().decode(
        chunks.reduce((acc, chunk) => {
          const merged = new Uint8Array(acc.byteLength + chunk.byteLength);
          merged.set(acc, 0);
          merged.set(chunk, acc.byteLength);
          return merged;
        }, new Uint8Array(0)),
      );

      const title =
        this.extractMeta(html, 'og:title') ||
        this.extractMeta(html, 'twitter:title') ||
        this.extractTitle(html);

      const description =
        this.extractMeta(html, 'og:description') ||
        this.extractMeta(html, 'twitter:description') ||
        this.extractMeta(html, 'description');

      const imageUrl =
        this.extractMeta(html, 'og:image') ||
        this.extractMeta(html, 'twitter:image');

      const siteName = this.extractMeta(html, 'og:site_name');

      return { title: sanitize(title), description: sanitize(description), imageUrl: sanitize(imageUrl), content: null, author: null, siteName: sanitize(siteName), type };
    } catch (err) {
      this.logger.warn(`Failed to scrape ${url}: ${String(err)}`);
      return this.empty(type);
    }
  }

  private empty(type: ContentType): ScrapeResult {
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

  private extractMeta(html: string, name: string): string | null {
    // Handles both property="og:*" and name="*" forms, and both attribute orderings
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"'<>]+)["']`,
        'i',
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"'<>]+)["'][^>]+(?:property|name)=["']${name}["']`,
        'i',
      ),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) return this.decodeEntities(m[1].trim());
    }
    return null;
  }

  private extractTitle(html: string): string | null {
    const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return m?.[1] ? this.decodeEntities(m[1].trim()) : null;
  }

  private decodeEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, code: string) =>
        String.fromCharCode(Number(code)),
      );
  }

  private async scrapePinterest(url: string): Promise<ScrapeResult> {
    const type: ContentType = 'pinterest';
    const siteName = 'Pinterest';

    let title: string | null = null;
    let imageUrl: string | null = null;
    let author: string | null = null;

    // Phase 1: oEmbed (primary source)
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

    // Phase 2: HTML fetch for description (best-effort)
    let description: string | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      clearTimeout(timeout);

      if (response.ok) {
        const reader = response.body?.getReader();
        if (reader) {
          const chunks: Uint8Array[] = [];
          let totalBytes = 0;
          const maxBytes = 500_000;

          while (true) {
            const { done, value } = await reader.read();
            if (done || !value) break;
            chunks.push(value);
            totalBytes += value.byteLength;
            if (totalBytes >= maxBytes) {
              await reader.cancel();
              break;
            }
          }

          const html = new TextDecoder().decode(
            chunks.reduce((acc, chunk) => {
              const merged = new Uint8Array(acc.byteLength + chunk.byteLength);
              merged.set(acc, 0);
              merged.set(chunk, acc.byteLength);
              return merged;
            }, new Uint8Array(0)),
          );

          description =
            this.extractMeta(html, 'og:description') ||
            this.extractMeta(html, 'twitter:description') ||
            this.extractMeta(html, 'description');

          if (!title) {
            title =
              this.extractMeta(html, 'og:title') ||
              this.extractMeta(html, 'twitter:title') ||
              this.extractTitle(html);
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Pinterest HTML fetch failed for ${url}: ${String(err)}`);
    }

    if (!title) {
      try {
        title = new URL(url).hostname.replace(/^www\./, '');
      } catch { /* keep null */ }
    }

    return { title: sanitize(title), description: sanitize(description), imageUrl: sanitize(imageUrl), content: null, author: sanitize(author), siteName, type };
  }

  private async scrapeTwitter(url: string): Promise<ScrapeResult> {
    const type: ContentType = 'tweet';
    const siteName = 'X';

    // Extract numeric tweet ID from the URL
    const tweetId = url.match(/\/status\/(\d+)/)?.[1] ?? null;

    // Normalise to twitter.com — oEmbed still uses the old domain
    const twitterUrl = url.replace('x.com', 'twitter.com');

    if (tweetId) {
      // Phase 1: Syndication API — same endpoint Twitter's own embed widget calls.
      // Requires a token derived from the tweet ID (added ~2024).
      try {
        const token = this.tweetToken(tweetId);
        const syndicationUrl =
          `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en&token=${token}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);

        const response = await fetch(syndicationUrl, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Referer: 'https://twitter.com/',
            Origin: 'https://twitter.com',
          },
        });
        clearTimeout(timeout);

        this.logger.log(`Twitter syndication status for ${tweetId}: ${response.status}`);

        if (response.ok) {
          const data = (await response.json()) as {
            text?: string;
            user?: { name?: string; screen_name?: string };
            mediaDetails?: Array<{
              type?: string;
              media_url_https?: string;
            }>;
          };

          this.logger.log(`Twitter syndication data keys: ${Object.keys(data).join(', ')}`);

          const title = sanitize(this.cleanTweetText(data.text ?? ''));
          const author = sanitize(data.user?.name ?? data.user?.screen_name ?? null);

          // Use the first media item's thumbnail (photo URL, or video poster)
          const media = data.mediaDetails?.[0];
          const imageUrl = sanitize(media?.media_url_https ?? null);

          if (title) {
            return { title, description: null, imageUrl, content: null, author, siteName, type };
          }
        } else {
          this.logger.warn(`Twitter syndication non-ok for ${tweetId}: ${response.status}`);
        }
      } catch (err) {
        this.logger.warn(`Twitter syndication failed for ${url}: ${String(err)}`);
      }

      // Phase 2: oEmbed fallback — official Twitter endpoint, always works for public tweets.
      // Returns an HTML blockquote whose <p> contains the tweet text.
      try {
        const oEmbedUrl =
          `https://publish.twitter.com/oembed?url=${encodeURIComponent(twitterUrl)}&omit_script=true`;

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

        this.logger.log(`Twitter oEmbed status for ${tweetId}: ${response.status}`);

        if (response.ok) {
          const data = (await response.json()) as {
            html?: string;
            author_name?: string;
          };

          const title = sanitize(this.extractOEmbedText(data.html ?? ''));
          const author = sanitize(data.author_name ?? null);

          return { title, description: null, imageUrl: null, content: null, author, siteName, type };
        } else {
          this.logger.warn(`Twitter oEmbed non-ok for ${tweetId}: ${response.status}`);
        }
      } catch (err) {
        this.logger.warn(`Twitter oEmbed failed for ${url}: ${String(err)}`);
      }
    }

    return this.empty(type);
  }

  /**
   * Computes the token required by the Twitter syndication API.
   * Formula: square the tweet ID with the last 9 digits stripped (i.e. the
   * high-order ~10 digits of the snowflake ID).  BigInt prevents precision loss.
   */
  private tweetToken(tweetId: string): string {
    const high = BigInt(tweetId.slice(0, Math.max(1, tweetId.length - 9)));
    return (high * high).toString();
  }

  /** Strips trailing t.co media links and decodes HTML entities from tweet text. */
  private cleanTweetText(text: string): string {
    return this.decodeEntities(text)
      .replace(/\s*https:\/\/t\.co\/\S+/g, '')
      .trim();
  }

  /** Extracts plain text from the <p> tag inside an oEmbed blockquote HTML string. */
  private extractOEmbedText(html: string): string | null {
    const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (!m?.[1]) return null;
    return m[1]
      .replace(/<a[^>]*>https:\/\/t\.co\/\S*<\/a>/gi, '') // remove t.co link elements
      .replace(/<[^>]+>/g, ' ')                            // strip remaining tags
      .replace(/\s+/g, ' ')
      .trim() || null;
  }

  private detectType(url: string): ContentType {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'tweet';
    if (url.includes('pinterest.com') || url.includes('pin.it')) return 'pinterest';
    return 'article';
  }
}
