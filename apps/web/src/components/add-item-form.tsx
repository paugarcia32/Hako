'use client';

import { trpc } from '@/lib/trpc';
import { useState } from 'react';

export function AddItemForm() {
  const [url, setUrl] = useState('');
  const utils = trpc.useUtils();

  const create = trpc.items.create.useMutation({
    onSuccess: () => {
      setUrl('');
      void utils.items.list.invalidate();
    },
  });

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    create.mutate({ url });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a URL to save..."
          required
          disabled={create.isPending}
          className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500"
        />
        <button
          type="submit"
          disabled={create.isPending || !url.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {create.isPending ? 'Saving…' : 'Add'}
        </button>
      </div>
      {create.isError && <p className="text-xs text-red-500">{create.error.message}</p>}
    </form>
  );
}
