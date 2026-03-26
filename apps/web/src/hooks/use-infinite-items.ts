'use client';

import type { SortOption, TypeFilter } from '@/components/filter-bar';
import { trpc } from '@/lib/trpc';
import type { Item } from '@hako/shared';
import { useMemo } from 'react';

type UseInfiniteItemsParams = {
  inboxOnly?: boolean;
  archivedOnly?: boolean;
  includeArchived?: boolean;
  collectionId?: string;
  typeFilter: TypeFilter;
  sort: SortOption;
  placeholderData?: boolean;
  refetchInterval?:
    | number
    | false
    | ((query: { state: { data: { pages: { items: Item[] }[] } | undefined } }) => number | false);
};

export function useInfiniteItems({
  inboxOnly,
  archivedOnly,
  includeArchived,
  collectionId,
  typeFilter,
  sort,
  placeholderData: usePlaceholderData,
  refetchInterval,
}: UseInfiniteItemsParams) {
  const sortBy = sort === 'alpha-asc' || sort === 'alpha-desc' ? 'title' : 'createdAt';
  const sortDir = sort === 'alpha-asc' || sort === 'date-asc' ? 'asc' : 'desc';
  const type = typeFilter !== 'all' ? typeFilter : undefined;

  const query = trpc.items.list.useInfiniteQuery(
    {
      limit: 50,
      inboxOnly,
      archivedOnly,
      includeArchived,
      collectionId,
      type,
      sortBy,
      sortDir,
    },
    {
      initialCursor: undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      ...(usePlaceholderData ? { placeholderData: (prev: unknown) => prev } : {}),
      ...(refetchInterval !== undefined ? { refetchInterval } : {}),
    },
  );

  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  return {
    items,
    isLoading: query.isLoading,
    // Don't dim the list while fetching next pages — the sentinel spinner handles that
    isFetching: query.isFetching && !query.isFetchingNextPage,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
