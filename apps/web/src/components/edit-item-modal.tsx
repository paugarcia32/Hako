'use client';

import { getCollectionIcon } from '@/lib/collection-icons';
import { trpc } from '@/lib/trpc';
import type { ContentType, Item } from '@hako/types';
import { COLLECTION_COLORS } from '@hako/types';
import { CheckIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';

const CONTENT_TYPES: ContentType[] = [
  'article',
  'youtube',
  'tweet',
  'link',
  'pinterest',
  'dribbble',
];

interface EditItemModalProps {
  item: Item;
  onClose: () => void;
}

export function EditItemModal({ item, onClose }: EditItemModalProps) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(item.title ?? '');
  const [description, setDescription] = useState(item.description ?? '');
  const [imageUrl, setImageUrl] = useState(item.imageUrl ?? '');
  const [type, setType] = useState<ContentType>(item.type);
  const [saveError, setSaveError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateItem = trpc.items.update.useMutation({
    onSuccess: () => {
      void utils.items.list.invalidate();
      onClose();
    },
    onError: (err) => {
      setSaveError(err.message || 'Failed to save. Please try again.');
    },
  });

  const addToCollection = trpc.collections.addItem.useMutation({
    onSuccess: () => void utils.items.list.invalidate(),
  });

  const removeFromCollection = trpc.collections.removeItem.useMutation({
    onSuccess: () => void utils.items.list.invalidate(),
  });

  const { data: collectionsData } = trpc.collections.list.useQuery({});

  const [localCollectionIds, setLocalCollectionIds] = useState(
    () => new Set(item.collections?.map((c) => c.collectionId) ?? []),
  );

  function handleCollectionToggle(collectionId: string, itemId: string) {
    if (localCollectionIds.has(collectionId)) {
      removeFromCollection.mutate({ collectionId, itemId });
      setLocalCollectionIds((prev) => {
        const next = new Set(prev);
        next.delete(collectionId);
        return next;
      });
    } else {
      addToCollection.mutate({ collectionId, itemId });
      setLocalCollectionIds((prev) => new Set(prev).add(collectionId));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    updateItem.mutate({
      id: item.id,
      title: title.trim() || null,
      description: description.trim() || null,
      imageUrl: imageUrl.trim() || null,
      type,
    });
  }

  const fieldClass =
    'w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-800 outline-none transition-colors placeholder:text-stone-300 focus:border-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-600 dark:focus:border-stone-500';

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click-to-close pattern; Escape key is handled via document keydown listener
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 py-12 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation wrapper, keyboard events bubble through */}
      <div
        className="w-full max-w-md shrink-0 rounded-xl border border-stone-200 bg-white p-5 shadow-xl dark:border-stone-700 dark:bg-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Edit item</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300"
          >
            <XMarkIcon className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="edit-title"
              className="text-xs font-medium text-stone-500 dark:text-stone-400"
            >
              Title
            </label>
            <input
              id="edit-title"
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Item title"
              className={fieldClass}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="edit-description"
              className="text-xs font-medium text-stone-500 dark:text-stone-400"
            >
              Description
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Item description"
              rows={3}
              className={`${fieldClass} resize-none`}
            />
          </div>

          {/* Image URL */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="edit-image-url"
              className="text-xs font-medium text-stone-500 dark:text-stone-400"
            >
              Image URL
            </label>
            <input
              id="edit-image-url"
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={fieldClass}
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="edit-type"
              className="text-xs font-medium text-stone-500 dark:text-stone-400"
            >
              Type
            </label>
            <div className="relative">
              <select
                id="edit-type"
                value={type}
                onChange={(e) => setType(e.target.value as ContentType)}
                className={`${fieldClass} appearance-none pr-8`}
              >
                {CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-stone-400" />
            </div>
          </div>

          {/* Collections */}
          {collectionsData && collectionsData.collections.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                Collections
              </span>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-stone-200 py-1 dark:border-stone-700">
                {collectionsData.collections.map((collection) => {
                  const isIn = localCollectionIds.has(collection.id);
                  const isPending = addToCollection.isPending || removeFromCollection.isPending;
                  const hex =
                    COLLECTION_COLORS.find((c) => c.id === collection.color)?.hex ?? '#78716c';
                  const IconComp = getCollectionIcon(collection.icon);
                  return (
                    <button
                      key={collection.id}
                      type="button"
                      disabled={isPending}
                      onClick={() => handleCollectionToggle(collection.id, item.id)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50 dark:text-stone-300 dark:hover:bg-stone-800"
                    >
                      <span className="flex size-4 shrink-0 items-center justify-center">
                        {isIn ? (
                          <CheckIcon className="size-3.5 text-accent-500" />
                        ) : IconComp ? (
                          <IconComp className="size-3.5" style={{ color: hex }} />
                        ) : (
                          <span className="size-2 rounded-full" style={{ background: hex }} />
                        )}
                      </span>
                      <span className="truncate">{collection.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {saveError && <p className="text-xs text-red-500 dark:text-red-400">{saveError}</p>}

          {/* Actions */}
          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-sm text-stone-500 transition-colors hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateItem.isPending}
              className="rounded-lg bg-stone-800 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
            >
              {updateItem.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
