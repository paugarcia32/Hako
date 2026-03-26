export const QUEUES = {
  SCRAPE: 'scrape',
  INDEX_SYNC: 'index-sync',
  READABILITY: 'readability', // Phase 3
  EMBEDDING: 'embedding', // Phase 3
} as const;

export type ScrapeJobData = {
  itemId: string;
  url: string;
  userId: string;
};

export type IndexSyncJobData = {
  itemId: string;
  userId: string;
};
