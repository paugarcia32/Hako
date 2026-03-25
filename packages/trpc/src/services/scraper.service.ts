import type { IScraper, ScrapeResult } from './scraper.interface';

export type { ScrapeResult };

export class ScraperService {
  constructor(private readonly strategies: IScraper[]) {}

  async scrape(url: string): Promise<ScrapeResult> {
    const strategy = this.strategies.find((s) => s.canHandle(url));
    if (!strategy) throw new Error(`No scraper strategy found for: ${url}`);
    return strategy.scrape(url);
  }
}
