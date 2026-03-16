'use client';

import { trpc } from '@/lib/trpc';
import { CheckIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import type { ContentType, Item } from '@inkbox/types';

const TYPE_LABELS: Record<ContentType, string> = {
  article: 'Article',
  youtube: 'YouTube',
  tweet: 'Tweet',
  link: 'Link',
};

function getFaviconUrl(url: string): string | null {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return null;
  }
}

export function ItemCard({ item }: { item: Item }) {
  const utils = trpc.useUtils();

  const markAsRead = trpc.items.markAsRead.useMutation({
    onSuccess: () => void utils.items.list.invalidate(),
  });

  const toggleFavorite = trpc.items.toggleFavorite.useMutation({
    onSuccess: () => void utils.items.list.invalidate(),
  });

  const favicon = getFaviconUrl(item.url);
  const date = new Date(item.createdAt).toLocaleDateString();

  return (
    <article className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
      {favicon && <img src={favicon} alt="" className="mt-0.5 size-5 shrink-0 rounded" />}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-400">
            {TYPE_LABELS[item.type]}
          </span>
          <time className="text-xs text-stone-400">{date}</time>
          {item.isRead && <span className="text-xs text-stone-400">Read</span>}
        </div>

        <h2 className="mt-1 truncate text-sm font-medium text-stone-900 dark:text-stone-100">
          {item.title ?? item.url}
        </h2>

        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-stone-500 dark:text-stone-400">
            {item.description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!item.isRead && (
          <button
            type="button"
            title="Mark as read"
            disabled={markAsRead.isPending}
            onClick={() => markAsRead.mutate({ id: item.id })}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50 dark:hover:bg-stone-800"
          >
            <CheckIcon className="size-4" />
          </button>
        )}
        <button
          type="button"
          title={item.isFavorite ? 'Unfavorite' : 'Favorite'}
          disabled={toggleFavorite.isPending}
          onClick={() => toggleFavorite.mutate({ id: item.id, isFavorite: !item.isFavorite })}
          className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50 dark:hover:bg-stone-800"
        >
          {item.isFavorite ? (
            <StarSolidIcon className="size-4 text-amber-400" />
          ) : (
            <StarIcon className="size-4" />
          )}
        </button>
      </div>
    </article>
  );
}
