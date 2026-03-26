import type { GroupBy } from '@/components/filter-bar';
import type { Item } from '@hako/shared';

export type Group = { key: string; label: string; items: Item[] };

export const DATE_BUCKET_ORDER = ['Today', 'Yesterday', 'This week', 'This month', 'Older'];

export function getDateBucket(dateStr: string): string {
  const itemDate = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const weekStart = new Date(today.getTime() - today.getDay() * 86_400_000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

  if (itemDay >= today) return 'Today';
  if (itemDay >= yesterday) return 'Yesterday';
  if (itemDay >= weekStart) return 'This week';
  if (itemDay >= monthStart) return 'This month';
  return 'Older';
}

export function buildGroups(items: Item[], groupBy: GroupBy): Group[] {
  if (groupBy === 'date') {
    const map = new Map<string, Item[]>();
    for (const item of items) {
      const bucket = getDateBucket(item.createdAt);
      if (!map.has(bucket)) map.set(bucket, []);
      map.get(bucket)?.push(item);
    }
    return DATE_BUCKET_ORDER.filter((b) => map.has(b)).map((b) => ({
      key: b,
      label: b,
      items: map.get(b) ?? [],
    }));
  }

  if (groupBy === 'collection') {
    const map = new Map<string, { label: string; items: Item[] }>();
    for (const item of items) {
      const cols = item.collections;
      if (!cols || cols.length === 0) {
        if (!map.has('__none__')) map.set('__none__', { label: 'No collection', items: [] });
        map.get('__none__')?.items.push(item);
      } else {
        for (const col of cols) {
          if (!map.has(col.collectionId))
            map.set(col.collectionId, { label: col.collectionName, items: [] });
          map.get(col.collectionId)?.items.push(item);
        }
      }
    }
    const groups: Group[] = [];
    for (const [key, { label, items: groupItems }] of map) {
      if (key !== '__none__') groups.push({ key, label, items: groupItems });
    }
    groups.sort((a, b) => a.label.localeCompare(b.label));
    if (map.has('__none__')) {
      groups.push({
        key: '__none__',
        label: 'No collection',
        items: map.get('__none__')?.items ?? [],
      });
    }
    return groups;
  }

  return [];
}
