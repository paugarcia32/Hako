import { type IndexSyncJobData, QUEUES } from '@hako/shared/queues';
import { Worker } from 'bullmq';
import { MeiliSearch } from 'meilisearch';
import { prisma } from '../prisma.js';
import { redis } from '../redis.js';

if (!process.env.MEILISEARCH_URL) {
  throw new Error('[index-sync] MEILISEARCH_URL is required');
}

const meili = new MeiliSearch({
  host: process.env.MEILISEARCH_URL,
  ...(process.env.MEILISEARCH_KEY && { apiKey: process.env.MEILISEARCH_KEY }),
});

export const indexSyncWorker = new Worker<IndexSyncJobData>(
  QUEUES.INDEX_SYNC,
  async (job) => {
    const { itemId } = job.data;
    const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId } });

    const doc = {
      id: item.id,
      userId: item.userId,
      title: item.title,
      description: item.description,
      siteName: item.siteName,
      author: item.author,
      type: item.type,
      isArchived: item.isArchived,
      isFavorite: item.isFavorite,
      createdAt: item.createdAt.toISOString(),
    };

    await meili.index('items').addDocuments([doc], { primaryKey: 'id' });
  },
  {
    connection: redis,
    concurrency: 5,
  },
);

indexSyncWorker.on('failed', (job, err) => {
  console.error(`[index-sync] job ${job?.id} failed:`, err.message);
});
