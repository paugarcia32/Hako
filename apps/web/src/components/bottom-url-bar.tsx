'use client';

import { usePasteHandler } from '@/lib/use-paste-handler';
import { trpc } from '@/lib/trpc';
import { useEffect, useRef, useState } from 'react';

export function BottomUrlBar() {
  const [url, setUrl] = useState('');
  const [toast, setToast] = useState<'saved' | 'error' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const create = trpc.items.create.useMutation({
    onSuccess: () => {
      setUrl('');
      setToast('saved');
      void utils.items.list.invalidate();
    },
    onError: () => setToast('error'),
  });

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
      create.mutate({ url: trimmed });
    } catch {
      setToast('error');
    }
  }

  usePasteHandler((pastedUrl) => {
    submit(pastedUrl);
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-stone-50/90 backdrop-blur-sm dark:border-stone-800 dark:bg-stone-900/90">
      <div className="mx-auto max-w-3xl px-6 py-2.5">
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit(url);
            }
          }}
          placeholder="Paste a link…"
          disabled={create.isPending}
          className="w-full bg-transparent text-sm text-stone-700 outline-none placeholder:text-stone-400 disabled:opacity-50 dark:text-stone-200 dark:placeholder:text-stone-600"
        />
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm transition-opacity ${
            toast === 'saved'
              ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast === 'saved' ? 'Saved!' : 'Invalid URL'}
        </div>
      )}
    </div>
  );
}
