import { Injectable } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';

export type ScrapeJobData = {
  itemId: string;
  url: string;
};

@Injectable()
export class ItemsProcessor {
  private worker: Worker;

  constructor() {
    this.worker = new Worker<ScrapeJobData>(
      'scrape',
      async (job: Job<ScrapeJobData>) => {
        console.log(`Processing item ${job.data.itemId}: ${job.data.url}`);
        // Scraping logic will go here
      },
      {
        connection: {
          url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
        },
      },
    );
  }
}
