import { QUEUES } from '@hako/shared/queues';
import { Queue } from 'bullmq';
import { redis } from './redis.js';

export const scrapeQueue = new Queue(QUEUES.SCRAPE, { connection: redis });
export const indexSyncQueue = new Queue(QUEUES.INDEX_SYNC, { connection: redis });
