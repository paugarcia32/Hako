import type { MeiliSearch } from 'meilisearch';

export async function setupMeilisearch(meili: MeiliSearch): Promise<void> {
  const index = meili.index('items');
  await index.updateSettings({
    searchableAttributes: ['title', 'description', 'siteName', 'author'],
    filterableAttributes: ['userId', 'type', 'isArchived', 'isFavorite'],
    sortableAttributes: ['createdAt'],
    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
  });
}
