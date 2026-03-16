'use client';

import { AddItemForm } from '@/components/add-item-form';
import { ItemCard } from '@/components/item-card';
import { trpc } from '@/lib/trpc';
import { InboxArrowDownIcon } from '@heroicons/react/24/outline';

export default function InboxPage() {
  const { data, isLoading, isError } = trpc.items.list.useQuery({});

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">Inbox</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Your saved articles, videos, and links.
        </p>
      </div>

      <div className="mb-6">
        <AddItemForm />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {['sk-1', 'sk-2', 'sk-3', 'sk-4'].map((id) => (
            <div
              key={id}
              className="h-20 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800"
            />
          ))}
        </div>
      )}

      {isError && <p className="text-sm text-red-500">Failed to load items.</p>}

      {data && data.items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 py-20 dark:border-stone-700">
          <InboxArrowDownIcon className="mb-3 size-8 text-stone-400 dark:text-stone-500" />
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Nothing saved yet
          </p>
          <p className="mt-1 text-sm text-stone-400">Paste a URL above to save your first item.</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <ul className="space-y-3">
          {data.items.map((item) => (
            <li key={item.id}>
              <ItemCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
