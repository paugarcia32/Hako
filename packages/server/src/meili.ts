import { MeiliSearch } from 'meilisearch';

export const meili = process.env.MEILISEARCH_URL
  ? new MeiliSearch({
      host: process.env.MEILISEARCH_URL,
      ...(process.env.MEILISEARCH_KEY && { apiKey: process.env.MEILISEARCH_KEY }),
    })
  : null;
