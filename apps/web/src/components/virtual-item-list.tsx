'use client';

import { ItemRow } from '@/components/item-row';
import { useKeyboardNav } from '@/contexts/keyboard-nav';
import type { Item } from '@hako/types';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef } from 'react';

interface VirtualItemListProps {
  items: Item[];
  hoveredId: string | null;
  onHoverChange: (id: string | null) => void;
  showCollection?: boolean;
  showArchivedBadge?: boolean;
  getSectionName?: (item: Item) => string | undefined;
}

// ItemRow is h-10 (40px) + space-y-0.5 gap (2px)
const ITEM_HEIGHT = 42;

export function VirtualItemList({
  items,
  hoveredId,
  onHoverChange,
  showCollection,
  showArchivedBadge,
  getSectionName,
}: VirtualItemListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const { setVirtualScrollToIndex } = useKeyboardNav();

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 10,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  useEffect(() => {
    setVirtualScrollToIndex((index: number) =>
      virtualizer.scrollToIndex(index, { behavior: 'smooth' }),
    );
    return () => setVirtualScrollToIndex(null);
  }, [virtualizer, setVirtualScrollToIndex]);

  return (
    <div
      ref={listRef}
      role="list"
      style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const item = items[virtualRow.index];
        if (!item) return null;
        return (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
            }}
          >
            <ItemRow
              item={item}
              {...(showCollection !== undefined && { showCollection })}
              {...(showArchivedBadge !== undefined && { showArchivedBadge })}
              {...(getSectionName !== undefined && { sectionName: getSectionName(item) })}
              hoveredId={hoveredId}
              onHoverChange={onHoverChange}
            />
          </div>
        );
      })}
    </div>
  );
}
