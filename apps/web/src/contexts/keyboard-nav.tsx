'use client';

import { useVimKeyboard } from '@/hooks/use-vim-keyboard';
import type { Item } from '@hako/types';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface KeyboardNavContextValue {
  items: Item[];
  setItems: (items: Item[]) => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  editingItem: Item | null;
  setEditingItem: (item: Item | null) => void;
  pendingFilterOpen: 'sort' | 'type' | 'group' | null;
  setPendingFilterOpen: (v: 'sort' | 'type' | 'group' | null) => void;
  helpOpen: boolean;
  setHelpOpen: (v: boolean) => void;
}

const KeyboardNavContext = createContext<KeyboardNavContextValue | null>(null);

export function useKeyboardNav() {
  const ctx = useContext(KeyboardNavContext);
  if (!ctx) throw new Error('useKeyboardNav must be used within KeyboardNavProvider');
  return ctx;
}

function KeyboardNavInner({ children }: { children: React.ReactNode }) {
  useVimKeyboard();
  return <>{children}</>;
}

export function KeyboardNavProvider({ children }: { children: React.ReactNode }) {
  const [items, setItemsRaw] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [pendingFilterOpen, setPendingFilterOpen] = useState<'sort' | 'type' | 'group' | null>(
    null,
  );
  const [helpOpen, setHelpOpen] = useState(false);

  const setItems = useCallback((newItems: Item[]) => setItemsRaw(newItems), []);

  const value = useMemo(
    () => ({
      items,
      setItems,
      selectedItemId,
      setSelectedItemId,
      editingItem,
      setEditingItem,
      pendingFilterOpen,
      setPendingFilterOpen,
      helpOpen,
      setHelpOpen,
    }),
    [items, setItems, selectedItemId, editingItem, pendingFilterOpen, helpOpen],
  );

  return (
    <KeyboardNavContext.Provider value={value}>
      <KeyboardNavInner>{children}</KeyboardNavInner>
    </KeyboardNavContext.Provider>
  );
}
