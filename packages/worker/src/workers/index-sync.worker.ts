import { type IndexSyncJobData, QUEUES } from '@hako/shared/queues';
import { Worker } from 'bullmq';
import { redis } from '../redis.js';

export const indexSyncWorker = new Worker<IndexSyncJobData>(
  QUEUES.INDEX_SYNC,
  async (job) => {
    // TODO Step 5: replace stub with real Meilisearch sync logic
    console.log(`[index-sync] received job ${job.id}`, job.data);
  },
  {
    connection: redis,
    concurrency: 5,
  },
);

indexSyncWorker.on('failed', (job, err) => {
  console.error(`[index-sync] job ${job?.id} failed:`, err.message);
});
