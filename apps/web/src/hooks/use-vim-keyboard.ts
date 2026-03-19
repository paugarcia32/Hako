'use client';

import { useKeyboardNav } from '@/contexts/keyboard-nav';
import { useItemActions } from '@/hooks/use-item-actions';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

const TABS = ['/inbox', '/all', '/collections', '/archive'];

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    (el as HTMLElement).isContentEditable
  );
}

export function useVimKeyboard() {
  const {
    items,
    selectedItemId,
    setSelectedItemId,
    setEditingItem,
    setPendingFilterOpen,
    helpOpen,
    setHelpOpen,
  } = useKeyboardNav();

  const router = useRouter();
  const pathname = usePathname();
  const { archive, unarchive, deleteItem } = useItemActions();

  // Refs to avoid stale closures in the event listener
  const itemsRef = useRef(items);
  const selectedItemIdRef = useRef(selectedItemId);
  const pathnameRef = useRef(pathname);
  const helpOpenRef = useRef(helpOpen);
  const archiveRef = useRef(archive);
  const unarchiveRef = useRef(unarchive);
  const deleteItemRef = useRef(deleteItem);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    selectedItemIdRef.current = selectedItemId;
  }, [selectedItemId]);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);
  useEffect(() => {
    helpOpenRef.current = helpOpen;
  }, [helpOpen]);
  useEffect(() => {
    archiveRef.current = archive;
  }, [archive]);
  useEffect(() => {
    unarchiveRef.current = unarchive;
  }, [unarchive]);
  useEffect(() => {
    deleteItemRef.current = deleteItem;
  }, [deleteItem]);

  // Chord state (refs so the event listener always sees latest values)
  const pendingChord = useRef<'g' | 'f' | null>(null);
  const chordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function clearChord() {
      pendingChord.current = null;
      if (chordTimer.current) {
        clearTimeout(chordTimer.current);
        chordTimer.current = null;
      }
    }

    function startChord(char: 'g' | 'f') {
      clearChord();
      pendingChord.current = char;
      chordTimer.current = setTimeout(clearChord, 1000);
    }

    function scrollToItem(id: string) {
      const el = document.querySelector(`[data-item-id="${id}"]`) as HTMLElement | null;
      if (!el) return;
      el.style.scrollMarginTop = '80px';
      el.style.scrollMarginBottom = '60px';
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function navigateItems(direction: 1 | -1) {
      const currentItems = itemsRef.current;
      if (currentItems.length === 0) return;

      const currentId = selectedItemIdRef.current;
      const currentIdx = currentId ? currentItems.findIndex((i) => i.id === currentId) : -1;

      let nextIdx: number;
      if (direction === 1) {
        nextIdx = currentIdx < currentItems.length - 1 ? currentIdx + 1 : 0;
      } else {
        nextIdx = currentIdx > 0 ? currentIdx - 1 : currentItems.length - 1;
      }

      const nextItem = currentItems[nextIdx];
      if (nextItem) {
        setSelectedItemId(nextItem.id);
        scrollToItem(nextItem.id);
      }
    }

    function getSelectedItem() {
      const id = selectedItemIdRef.current;
      if (!id) return null;
      return itemsRef.current.find((i) => i.id === id) ?? null;
    }

    function onKeyDown(e: KeyboardEvent) {
      // If a chord is pending, handle it regardless of input focus
      if (pendingChord.current) {
        const chord = pendingChord.current;
        clearChord();

        if (chord === 'g') {
          if (e.key === 'g') {
            // gg — jump to first item
            e.preventDefault();
            const first = itemsRef.current[0];
            if (first) {
              setSelectedItemId(first.id);
              scrollToItem(first.id);
            }
            return;
          }
          if (e.key === '1') {
            e.preventDefault();
            router.push('/inbox');
            return;
          }
          if (e.key === '2') {
            e.preventDefault();
            router.push('/all');
            return;
          }
          if (e.key === '3') {
            e.preventDefault();
            router.push('/collections');
            return;
          }
          if (e.key === '4') {
            e.preventDefault();
            router.push('/archive');
            return;
          }
          if (e.key === 's') {
            e.preventDefault();
            router.push('/settings');
            return;
          }
        }

        if (chord === 'f') {
          if (e.key === 's') {
            e.preventDefault();
            setPendingFilterOpen('sort');
            return;
          }
          if (e.key === 't') {
            e.preventDefault();
            setPendingFilterOpen('type');
            return;
          }
          if (e.key === 'g') {
            e.preventDefault();
            setPendingFilterOpen('group');
            return;
          }
        }

        // Unrecognized chord key — clear and do nothing
        return;
      }

      // Block single-key shortcuts while typing
      if (isInputFocused()) return;

      // Help overlay toggle (works even when help is open)
      if (e.key === '?') {
        e.preventDefault();
        setHelpOpen(!helpOpenRef.current);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedItemId(null);
        setHelpOpen(false);
        return;
      }

      // Block all other shortcuts while help is open
      if (helpOpenRef.current) return;

      // Item navigation
      if (e.key === 'j' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigateItems(1);
        return;
      }
      if (e.key === 'k' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigateItems(-1);
        return;
      }
      if (e.key === 'G') {
        e.preventDefault();
        const last = itemsRef.current[itemsRef.current.length - 1];
        if (last) {
          setSelectedItemId(last.id);
          scrollToItem(last.id);
        }
        return;
      }

      // Tab navigation (h/l)
      if (e.key === 'h') {
        e.preventDefault();
        const curr = pathnameRef.current;
        const idx = TABS.findIndex((t) => curr.startsWith(t));
        const prev = idx > 0 ? TABS[idx - 1] : TABS[TABS.length - 1];
        if (prev) router.push(prev);
        return;
      }
      if (e.key === 'l') {
        e.preventDefault();
        const curr = pathnameRef.current;
        const idx = TABS.findIndex((t) => curr.startsWith(t));
        const next = idx >= 0 && idx < TABS.length - 1 ? TABS[idx + 1] : TABS[0];
        if (next) router.push(next);
        return;
      }

      // Chord starters
      if (e.key === 'g') {
        e.preventDefault();
        startChord('g');
        return;
      }
      if (e.key === 'f') {
        e.preventDefault();
        startChord('f');
        return;
      }

      // Search
      if (e.key === '/') {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('focus-search-bar'));
        return;
      }

      // Item actions (require a selected item)
      const selected = getSelectedItem();
      if (!selected) return;

      if (e.key === 'Enter' || e.key === 'o') {
        e.preventDefault();
        window.open(selected.url, '_blank', 'noopener,noreferrer');
        return;
      }
      if (e.key === 'e') {
        e.preventDefault();
        setEditingItem(selected);
        return;
      }
      if (e.key === 'a') {
        e.preventDefault();
        if (selected.isArchived) {
          unarchiveRef.current.mutate({ id: selected.id });
        } else {
          archiveRef.current.mutate({ id: selected.id });
        }
        return;
      }
      if (e.key === 'x') {
        e.preventDefault();
        const currentItems = itemsRef.current;
        const idx = currentItems.findIndex((i) => i.id === selected.id);
        const nextIdx = idx < currentItems.length - 1 ? idx + 1 : idx - 1;
        const next = nextIdx >= 0 ? currentItems[nextIdx] : null;
        deleteItemRef.current.mutate({ id: selected.id });
        setSelectedItemId(next?.id ?? null);
        return;
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      clearChord();
    };
  }, [router, setSelectedItemId, setEditingItem, setPendingFilterOpen, setHelpOpen]);
}
