import type { SortOption, TypeFilter } from '@/components/filter-bar';
import type { Item } from '@hako/types';
import { useMemo, useState } from 'react';

export function useItemFiltering(items: Item[]) {
  const [sort, setSort] = useState<SortOption>('date-desc');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const filtered = useMemo(() => {
    let result = items;
    if (typeFilter !== 'all') {
      result = result.filter((item) => item.type === typeFilter);
    }
    return [...result].sort((a, b) => {
      if (sort === 'date-desc')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === 'date-asc')
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      const ta = (a.title?.trim() || a.url).toLowerCase();
      const tb = (b.title?.trim() || b.url).toLowerCase();
      return sort === 'alpha-asc' ? ta.localeCompare(tb) : tb.localeCompare(ta);
    });
  }, [items, sort, typeFilter]);

  return { sort, setSort, typeFilter, setTypeFilter, filtered };
}
