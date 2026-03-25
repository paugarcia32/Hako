import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScraperUtilsService } from '../scraper-utils.service';
import { DribbbleScraperService } from './dribbble.scraper';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(html: string, status = 200) {
  const bytes = new TextEncoder().encode(html);
  let consumed = false;
  const reader = {
    read: vi.fn().mockImplementation(() => {
      if (!consumed) {
        consumed = true;
        return Promise.resolve({ done: false, value: bytes });
      }
      return Promise.resolve({ done: true, value: undefined });
    }),
    cancel: vi.fn().mockResolvedValue(undefined),
  };
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      body: { getReader: () => reader },
    }),
  );
}

function mockFetchError(error = new Error('Network error')) {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
}

const WAF_CHALLENGE = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title></title>
<script>window.awsWafCookieDomainList = [];</script></head><body></body></html>`;

// Realistic Dribbble shot HTML (og:title is clean — no "by Author" suffix)
const SHOT_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Duwy - Personal Portfolio Website by Natasha Belova for Korsa on Dribbble</title>
    <meta property="og:title" content="Duwy - Personal Portfolio Website" />
    <meta property="og:description" content="A sleek personal portfolio design." />
    <meta property="og:image" content="https://cdn.dribbble.com/userupload/shot-preview.png" />
    <meta property="og:site_name" content="Dribbble" />
    <meta name="twitter:title" content="Duwy - Personal Portfolio Website" />
    <meta name="twitter:image" content="https://cdn.dribbble.com/userupload/shot-preview.png" />
  </head>
  <body></body>
</html>`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DribbbleScraperService', () => {
  let service: DribbbleScraperService;

  beforeEach(() => {
    service = new DribbbleScraperService(new ScraperUtilsService());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── canHandle ─────────────────────────────────────────────────────────────

  describe('canHandle', () => {
    it('handles dribbble.com shot URLs', () => {
      expect(service.canHandle('https://dribbble.com/shots/12345678-My-Shot')).toBe(true);
    });

    it('handles www.dribbble.com', () => {
      expect(service.canHandle('https://www.dribbble.com/shots/12345678')).toBe(true);
    });

    it('handles dribbble.com tag pages', () => {
      expect(service.canHandle('https://dribbble.com/tags/ui')).toBe(true);
    });

    it('returns false for non-Dribbble URLs', () => {
      expect(service.canHandle('https://pinterest.com/pin/123')).toBe(false);
      expect(service.canHandle('https://behance.net/gallery/123')).toBe(false);
      expect(service.canHandle('https://example.com')).toBe(false);
    });
  });

  // ── isWafChallenge ────────────────────────────────────────────────────────

  describe('isWafChallenge', () => {
    it('returns true for small HTML containing WAF marker', () => {
      expect(service.isWafChallenge(WAF_CHALLENGE)).toBe(true);
    });

    it('returns false for normal sized HTML', () => {
      const bigHtml = SHOT_HTML + 'x'.repeat(15_000);
      expect(service.isWafChallenge(bigHtml)).toBe(false);
    });

    it('returns false for small HTML without WAF marker', () => {
      expect(service.isWafChallenge('<html><head></head><body>tiny</body></html>')).toBe(false);
    });
  });

  // ── extractTitleFromSlug ──────────────────────────────────────────────────

  describe('extractTitleFromSlug', () => {
    it('extracts title from a full shot URL', () => {
      expect(
        service.extractTitleFromSlug(
          'https://dribbble.com/shots/25614963-Duwy-Personal-Portfolio-Website',
        ),
      ).toBe('Duwy Personal Portfolio Website');
    });

    it('handles trailing slash', () => {
      expect(service.extractTitleFromSlug('https://dribbble.com/shots/12345678-My-Shot/')).toBe(
        'My Shot',
      );
    });

    it('returns null for URLs with no slug (ID only)', () => {
      expect(service.extractTitleFromSlug('https://dribbble.com/shots/12345678')).toBeNull();
    });

    it('returns null for non-shot URLs', () => {
      expect(service.extractTitleFromSlug('https://dribbble.com/tags/ui')).toBeNull();
    });
  });

  // ── extractAuthor ─────────────────────────────────────────────────────────

  describe('extractAuthor', () => {
    it('extracts author using og:title to locate the "by" boundary', () => {
      expect(
        service.extractAuthor(
          'Duwy - Personal Portfolio Website by Natasha Belova for Korsa on Dribbble',
          'Duwy - Personal Portfolio Website',
        ),
      ).toBe('Natasha Belova for Korsa');
    });

    it('extracts single-word author', () => {
      expect(service.extractAuthor('Shot Title by Jane on Dribbble', 'Shot Title')).toBe('Jane');
    });

    it('returns null when pageTitle is null', () => {
      expect(service.extractAuthor(null, 'Shot Title')).toBeNull();
    });

    it('returns null when there is no "by" segment', () => {
      expect(service.extractAuthor('Shot Title on Dribbble', 'Shot Title')).toBeNull();
    });

    it('falls back to regex when og:title prefix does not match', () => {
      // pageTitle doesn't start with ogTitle — "on Dribbble" is stripped first, then regex runs
      expect(
        service.extractAuthor('Shot Title by Some Author on Dribbble', 'Different Title'),
      ).toBe('Some Author');
    });
  });

  // ── HTML scraping (successful) ────────────────────────────────────────────

  describe('HTML scraping — real page', () => {
    it('extracts clean title from og:title (no author suffix)', async () => {
      mockFetch(SHOT_HTML);
      const { title } = await service.scrape(
        'https://dribbble.com/shots/25614963-Duwy-Personal-Portfolio-Website',
      );
      expect(title).toBe('Duwy - Personal Portfolio Website');
    });

    it('extracts author from the <title> tag', async () => {
      mockFetch(SHOT_HTML);
      const { author } = await service.scrape(
        'https://dribbble.com/shots/25614963-Duwy-Personal-Portfolio-Website',
      );
      expect(author).toBe('Natasha Belova for Korsa');
    });

    it('extracts description from og:description', async () => {
      mockFetch(SHOT_HTML);
      const { description } = await service.scrape('https://dribbble.com/shots/12345678');
      expect(description).toBe('A sleek personal portfolio design.');
    });

    it('extracts imageUrl from og:image', async () => {
      mockFetch(SHOT_HTML);
      const { imageUrl } = await service.scrape('https://dribbble.com/shots/12345678');
      expect(imageUrl).toBe('https://cdn.dribbble.com/userupload/shot-preview.png');
    });

    it('always sets type to dribbble', async () => {
      mockFetch(SHOT_HTML);
      const { type } = await service.scrape('https://dribbble.com/shots/12345678');
      expect(type).toBe('image');
    });

    it('always sets siteName to Dribbble', async () => {
      mockFetch(SHOT_HTML);
      const { siteName } = await service.scrape('https://dribbble.com/shots/12345678');
      expect(siteName).toBe('Dribbble');
    });

    it('falls back to twitter:title when og:title is absent', async () => {
      mockFetch(`
        <title>Shot by Author on Dribbble</title>
        <meta name="twitter:title" content="Twitter Shot Title" />
      `);
      const { title } = await service.scrape('https://dribbble.com/shots/12345678');
      expect(title).toBe('Twitter Shot Title');
    });

    it('falls back to <title> tag when og:title and twitter:title are absent', async () => {
      mockFetch('<html><head><title>Plain Title by Author on Dribbble</title></head></html>');
      const { title } = await service.scrape('https://dribbble.com/shots/12345678-Plain-Title');
      expect(title).toBe('Plain Title by Author on Dribbble');
    });
  });

  // ── WAF challenge fallback ────────────────────────────────────────────────

  describe('WAF challenge fallback', () => {
    it('uses URL slug as title when WAF challenge is received', async () => {
      mockFetch(WAF_CHALLENGE);
      const { title } = await service.scrape(
        'https://dribbble.com/shots/25614963-Duwy-Personal-Portfolio-Website',
      );
      expect(title).toBe('Duwy Personal Portfolio Website');
    });

    it('returns null imageUrl, description, and author on WAF challenge', async () => {
      mockFetch(WAF_CHALLENGE);
      const result = await service.scrape(
        'https://dribbble.com/shots/25614963-Duwy-Personal-Portfolio-Website',
      );
      expect(result.imageUrl).toBeNull();
      expect(result.description).toBeNull();
      expect(result.author).toBeNull();
    });

    it('still returns type dribbble on WAF challenge', async () => {
      mockFetch(WAF_CHALLENGE);
      const { type } = await service.scrape(
        'https://dribbble.com/shots/25614963-Duwy-Personal-Portfolio-Website',
      );
      expect(type).toBe('image');
    });

    it('still returns siteName Dribbble on WAF challenge', async () => {
      mockFetch(WAF_CHALLENGE);
      const { siteName } = await service.scrape(
        'https://dribbble.com/shots/25614963-Duwy-Personal-Portfolio-Website',
      );
      expect(siteName).toBe('Dribbble');
    });
  });

  // ── Error / network failure fallback ──────────────────────────────────────

  describe('error handling', () => {
    it('uses URL slug title on network error', async () => {
      mockFetchError(new Error('ECONNREFUSED'));
      const { title } = await service.scrape('https://dribbble.com/shots/12345678-My-Shot-Title');
      expect(title).toBe('My Shot Title');
    });

    it('uses hostname when URL has no slug', async () => {
      mockFetchError();
      const { title } = await service.scrape('https://dribbble.com/shots/12345678');
      expect(title).toBe('dribbble.com');
    });

    it('returns null imageUrl/description/author on network error', async () => {
      mockFetchError();
      const result = await service.scrape('https://dribbble.com/shots/12345678-Shot');
      expect(result.imageUrl).toBeNull();
      expect(result.description).toBeNull();
      expect(result.author).toBeNull();
    });

    it('always returns type dribbble even on error', async () => {
      mockFetchError();
      const { type } = await service.scrape('https://dribbble.com/shots/12345678');
      expect(type).toBe('image');
    });

    it('returns null body fallback to slug', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, body: null }));
      const { title } = await service.scrape('https://dribbble.com/shots/12345678-My-Shot-Title');
      expect(title).toBe('My Shot Title');
    });

    it('always returns the full result shape', async () => {
      mockFetchError();
      const result = await service.scrape('https://dribbble.com/shots/12345678-Shot');
      expect(result).toMatchObject({
        description: null,
        imageUrl: null,
        content: null,
        author: null,
        siteName: 'Dribbble',
        type: 'image',
      });
    });
  });

  // ── Full integration ──────────────────────────────────────────────────────

  describe('full integration', () => {
    it('extracts all fields from a realistic Dribbble shot page', async () => {
      mockFetch(SHOT_HTML);
      const result = await service.scrape(
        'https://dribbble.com/shots/25614963-Duwy-Personal-Portfolio-Website',
      );
      expect(result).toMatchObject({
        title: 'Duwy - Personal Portfolio Website',
        author: 'Natasha Belova for Korsa',
        description: 'A sleek personal portfolio design.',
        imageUrl: 'https://cdn.dribbble.com/userupload/shot-preview.png',
        content: null,
        siteName: 'Dribbble',
        type: 'image',
      });
    });

    it('WAF challenge → slug title with correct type', async () => {
      mockFetch(WAF_CHALLENGE);
      const result = await service.scrape(
        'https://dribbble.com/shots/25614963-Duwy-Personal-Portfolio-Website',
      );
      expect(result.title).toBe('Duwy Personal Portfolio Website');
      expect(result.type).toBe('image');
      expect(result.siteName).toBe('Dribbble');
    });
  });
});
