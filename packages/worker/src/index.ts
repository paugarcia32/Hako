import 'dotenv/config';
import { redis } from './redis.js';
import { indexSyncWorker } from './workers/index-sync.worker.js';
import { scrapeWorker } from './workers/scrape.worker.js';

const workers = [scrapeWorker, indexSyncWorker];

async function shutdown(signal: string) {
  console.log(`[worker] ${signal} received — closing workers`);
  await Promise.all(workers.map((w) => w.close()));
  await redis.quit();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

console.log('[worker] started — waiting for jobs');
