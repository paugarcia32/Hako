import { QUEUES, type ScrapeJobData } from '@hako/shared/queues';
import { Worker } from 'bullmq';
import { redis } from '../redis.js';

export const scrapeWorker = new Worker<ScrapeJobData>(
  QUEUES.SCRAPE,
  async (job) => {
    // TODO Step 3: replace stub with real scraping logic
    console.log(`[scrape] received job ${job.id}`, job.data);
  },
  {
    connection: redis,
    concurrency: 3,
  },
);

scrapeWorker.on('failed', (job, err) => {
  console.error(`[scrape] job ${job?.id} failed:`, err.message);
});
