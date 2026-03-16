import { describe, expect, it } from 'vitest';
import { ScraperService } from './scraper.service';

describe('ScraperService', () => {
  const service = new ScraperService();

  describe('scrape — type detection', () => {
    it('returns youtube for youtube.com URLs', async () => {
      const result = await service.scrape('https://www.youtube.com/watch?v=abc123');
      expect(result.type).toBe('youtube');
    });

    it('returns youtube for youtu.be short URLs', async () => {
      const result = await service.scrape('https://youtu.be/abc123');
      expect(result.type).toBe('youtube');
    });

    it('returns tweet for twitter.com URLs', async () => {
      const result = await service.scrape('https://twitter.com/user/status/123');
      expect(result.type).toBe('tweet');
    });

    it('returns tweet for x.com URLs', async () => {
      const result = await service.scrape('https://x.com/user/status/123');
      expect(result.type).toBe('tweet');
    });

    it('returns article for generic URLs', async () => {
      const result = await service.scrape('https://example.com/some-article');
      expect(result.type).toBe('article');
    });

    it('returns article for github.com URLs (fallback)', async () => {
      const result = await service.scrape('https://github.com/user/repo');
      expect(result.type).toBe('article');
    });
  });

  describe('scrape — return shape', () => {
    it('returns null for all metadata fields', async () => {
      const result = await service.scrape('https://example.com');
      expect(result.title).toBeNull();
      expect(result.description).toBeNull();
      expect(result.imageUrl).toBeNull();
      expect(result.content).toBeNull();
      expect(result.author).toBeNull();
      expect(result.siteName).toBeNull();
    });

    it('returns the correct type field based on URL', async () => {
      const youtube = await service.scrape('https://youtube.com/watch?v=1');
      const tweet = await service.scrape('https://twitter.com/user/status/1');
      const article = await service.scrape('https://blog.example.com/post');

      expect(youtube.type).toBe('youtube');
      expect(tweet.type).toBe('tweet');
      expect(article.type).toBe('article');
    });
  });
});
