import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScraperUtilsService } from '../scraper-utils.service';
import { YoutubeScraperService } from './youtube.scraper';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Mocks a sequence of fetch responses. Each item is consumed in order;
 * the last item repeats if there are more calls than items.
 * Set `isJson: true` for oEmbed API responses (returns .json() instead of .body stream).
 */
function mockFetchSequence(
  ...responses: Array<{ body: string; status?: number; isJson?: boolean }>
) {
  let callIndex = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => {
      const config = responses[callIndex] ??
        responses[responses.length - 1] ?? { body: '', status: 200 };
      callIndex++;
      const status = config.status ?? 200;
      const ok = status >= 200 && status < 300;

      if (config.isJson) {
        return Promise.resolve({
          ok,
          status,
          body: null,
          json: vi.fn().mockResolvedValue(JSON.parse(config.body)),
        });
      }

      const bytes = new TextEncoder().encode(config.body);
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
      return Promise.resolve({
        ok,
        status,
        body: { getReader: () => reader },
        json: vi.fn().mockResolvedValue({}),
      });
    }),
  );
}

function mockFetchError(error = new Error('Network error')) {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
}

const OEMBED_VIDEO = JSON.stringify({
  title: 'My Awesome Video',
  author_name: 'Cool Channel',
  thumbnail_url: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
  provider_name: 'YouTube',
  type: 'video',
});

const DESCRIPTION_HTML = `
  <html><head>
    <meta property="og:description" content="This is the video description." />
  </head></html>
`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('YoutubeScraperService', () => {
  let service: YoutubeScraperService;

  beforeEach(() => {
    service = new YoutubeScraperService(new ScraperUtilsService());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── canHandle ─────────────────────────────────────────────────────────────

  describe('canHandle', () => {
    it('handles youtube.com watch URLs', () => {
      expect(service.canHandle('https://www.youtube.com/watch?v=abc123')).toBe(true);
    });

    it('handles youtu.be short URLs', () => {
      expect(service.canHandle('https://youtu.be/abc123')).toBe(true);
    });

    it('handles YouTube Shorts', () => {
      expect(service.canHandle('https://www.youtube.com/shorts/abc123')).toBe(true);
    });

    it('handles youtube.com embed URLs', () => {
      expect(service.canHandle('https://www.youtube.com/embed/abc123')).toBe(true);
    });

    it('returns false for non-YouTube URLs', () => {
      expect(service.canHandle('https://vimeo.com/123456')).toBe(false);
      expect(service.canHandle('https://example.com')).toBe(false);
      expect(service.canHandle('https://twitter.com/user/status/1')).toBe(false);
    });
  });

  // ── Phase 1: oEmbed ───────────────────────────────────────────────────────

  describe('oEmbed phase', () => {
    it('extracts title from oEmbed response', async () => {
      mockFetchSequence({ body: OEMBED_VIDEO, isJson: true }, { body: DESCRIPTION_HTML });
      const { title } = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(title).toBe('My Awesome Video');
    });

    it('extracts author (channel name) from oEmbed', async () => {
      mockFetchSequence({ body: OEMBED_VIDEO, isJson: true }, { body: DESCRIPTION_HTML });
      const { author } = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(author).toBe('Cool Channel');
    });

    it('extracts thumbnail as imageUrl from oEmbed', async () => {
      mockFetchSequence({ body: OEMBED_VIDEO, isJson: true }, { body: DESCRIPTION_HTML });
      const { imageUrl } = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(imageUrl).toBe('https://i.ytimg.com/vi/abc123/hqdefault.jpg');
    });

    it('sets siteName to YouTube', async () => {
      mockFetchSequence({ body: OEMBED_VIDEO, isJson: true }, { body: DESCRIPTION_HTML });
      const { siteName } = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(siteName).toBe('YouTube');
    });

    it('sets type to youtube', async () => {
      mockFetchSequence({ body: OEMBED_VIDEO, isJson: true }, { body: DESCRIPTION_HTML });
      const { type } = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(type).toBe('youtube');
    });

    it('fetches description from HTML after successful oEmbed', async () => {
      mockFetchSequence({ body: OEMBED_VIDEO, isJson: true }, { body: DESCRIPTION_HTML });
      const { description } = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(description).toBe('This is the video description.');
    });

    it('returns null description when HTML fetch for description fails', async () => {
      // oEmbed succeeds, but HTML fetch throws
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: vi.fn().mockResolvedValue(JSON.parse(OEMBED_VIDEO)),
            });
          }
          return Promise.reject(new Error('Network error'));
        }),
      );
      const { title, description } = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(title).toBe('My Awesome Video');
      expect(description).toBeNull();
    });

    it('returns null description when HTML has no description meta', async () => {
      mockFetchSequence(
        { body: OEMBED_VIDEO, isJson: true },
        { body: '<html><head><title>Video</title></head></html>' },
      );
      const { description } = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(description).toBeNull();
    });

    it('falls through to HTML phase when oEmbed returns non-ok (404)', async () => {
      mockFetchSequence(
        { body: '{}', status: 404, isJson: true },
        {
          body: `<html><head>
            <meta property="og:title" content="HTML Fallback Title" />
            <meta property="og:description" content="HTML fallback description." />
            <meta property="og:image" content="https://example.com/thumb.jpg" />
          </head></html>`,
        },
      );
      const result = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(result.title).toBe('HTML Fallback Title');
      expect(result.description).toBe('HTML fallback description.');
      expect(result.imageUrl).toBe('https://example.com/thumb.jpg');
    });

    it('falls through to HTML phase when oEmbed throws', async () => {
      let callCount = 0;
      const bytes = new TextEncoder().encode(
        `<html><head><meta property="og:title" content="From HTML" /></head></html>`,
      );
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) return Promise.reject(new Error('oEmbed timeout'));
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
          return Promise.resolve({ ok: true, status: 200, body: { getReader: () => reader } });
        }),
      );
      const { title } = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(title).toBe('From HTML');
    });

    it('falls through when oEmbed returns empty title', async () => {
      mockFetchSequence(
        {
          body: JSON.stringify({ title: '', author_name: 'Channel', thumbnail_url: 'https://img' }),
          isJson: true,
        },
        {
          body: `<html><head><meta property="og:title" content="HTML Title" /></head></html>`,
        },
      );
      const { title } = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(title).toBe('HTML Title');
    });
  });

  // ── Phase 2: HTML fallback ────────────────────────────────────────────────

  describe('HTML fallback phase', () => {
    it('extracts title from og:title when oEmbed fails', async () => {
      mockFetchSequence(
        { body: '{}', status: 404, isJson: true },
        {
          body: `<meta property="og:title" content="OG Title" /><title>HTML Title</title>`,
        },
      );
      const { title } = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(title).toBe('OG Title');
    });

    it('falls back to <title> tag when og:title is absent', async () => {
      mockFetchSequence(
        { body: '{}', status: 404, isJson: true },
        { body: '<html><head><title>Plain Title</title></head></html>' },
      );
      const { title } = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(title).toBe('Plain Title');
    });

    it('extracts description from og:description in HTML fallback', async () => {
      mockFetchSequence(
        { body: '{}', status: 404, isJson: true },
        {
          body: `<meta property="og:description" content="Fallback desc" />`,
        },
      );
      const { description } = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(description).toBe('Fallback desc');
    });

    it('extracts imageUrl from og:image in HTML fallback', async () => {
      mockFetchSequence(
        { body: '{}', status: 404, isJson: true },
        {
          body: `<meta property="og:image" content="https://example.com/thumb.jpg" />`,
        },
      );
      const { imageUrl } = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(imageUrl).toBe('https://example.com/thumb.jpg');
    });

    it('sets author to null in HTML fallback', async () => {
      mockFetchSequence(
        { body: '{}', status: 404, isJson: true },
        { body: `<meta property="og:title" content="Video Title" />` },
      );
      const { author } = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(author).toBeNull();
    });
  });

  // ── Error handling ────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('returns emptyResult when both phases fail', async () => {
      mockFetchError(new Error('ECONNREFUSED'));
      const result = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(result.title).toBeNull();
      expect(result.description).toBeNull();
      expect(result.imageUrl).toBeNull();
    });

    it('always returns type youtube even when both phases fail', async () => {
      mockFetchError();
      const { type } = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(type).toBe('youtube');
    });

    it('returns type youtube for youtu.be URLs too', async () => {
      mockFetchError();
      const { type } = await service.scrape('https://youtu.be/abc123');
      expect(type).toBe('youtube');
    });

    it('always returns the full result shape', async () => {
      mockFetchError();
      const result = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(result).toMatchObject({
        title: null,
        description: null,
        imageUrl: null,
        content: null,
        author: null,
        siteName: null,
        type: 'youtube',
      });
    });

    it('returns nulls when HTML fallback body is null', async () => {
      mockFetchSequence({ body: '{}', status: 404, isJson: true });
      // Second call returns null body
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              ok: false,
              status: 404,
              json: vi.fn().mockResolvedValue({}),
            });
          }
          return Promise.resolve({ ok: true, status: 200, body: null });
        }),
      );
      const result = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(result.title).toBeNull();
    });
  });

  // ── Full integration ──────────────────────────────────────────────────────

  describe('full integration', () => {
    it('returns all fields populated via oEmbed + HTML description', async () => {
      mockFetchSequence({ body: OEMBED_VIDEO, isJson: true }, { body: DESCRIPTION_HTML });
      const result = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(result).toMatchObject({
        title: 'My Awesome Video',
        description: 'This is the video description.',
        imageUrl: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
        content: null,
        author: 'Cool Channel',
        siteName: 'YouTube',
        type: 'youtube',
      });
    });

    it('handles HTML entities in oEmbed title', async () => {
      mockFetchSequence(
        {
          body: JSON.stringify({
            title: 'Foo &amp; Bar',
            author_name: 'Channel',
            thumbnail_url: 'https://img',
          }),
          isJson: true,
        },
        { body: '' },
      );
      const { title } = await service.scrape('https://www.youtube.com/watch?v=abc123');
      // oEmbed returns decoded JSON, no entity encoding expected
      expect(title).toBe('Foo &amp; Bar');
    });
  });
});
