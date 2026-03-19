'use client';

import { EditItemModal } from '@/components/edit-item-modal';
import { useKeyboardNav } from '@/contexts/keyboard-nav';
import { createPortal } from 'react-dom';

// Renders the edit modal for keyboard-triggered edits
export function KeyboardEditPortal() {
  const { editingItem, setEditingItem } = useKeyboardNav();
  if (!editingItem) return null;
  return createPortal(
    <EditItemModal item={editingItem} onClose={() => setEditingItem(null)} />,
    document.body,
  );
}

interface ShortcutRowProps {
  keys: string[];
  label: string;
}

function ShortcutRow({ keys, label }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-xs text-stone-500 dark:text-stone-400">{label}</span>
      <div className="flex shrink-0 items-center gap-1">
        {keys.map((k, i) => (
          <kbd
            // biome-ignore lint/suspicious/noArrayIndexKey: static shortcut key list, never reordered
            key={i}
            className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-stone-200 bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div>
      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
        {title}
      </h3>
      <div className="divide-y divide-stone-100 dark:divide-stone-800">{children}</div>
    </div>
  );
}

export function KeyboardShortcutsHelp() {
  const { helpOpen, setHelpOpen } = useKeyboardNav();
  if (!helpOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={() => setHelpOpen(false)}
      onKeyDown={(e) => e.key === 'Escape' && setHelpOpen(false)}
      role="presentation"
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-stone-700 dark:bg-stone-900"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5 dark:border-stone-800">
          <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
            Keyboard shortcuts
          </h2>
          <kbd className="inline-flex items-center justify-center rounded border border-stone-200 bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] text-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400">
            ?
          </kbd>
        </div>

        {/* Shortcuts */}
        <div className="space-y-5 px-5 py-4">
          <Section title="Navigation">
            <ShortcutRow keys={['j']} label="Next item" />
            <ShortcutRow keys={['k']} label="Previous item" />
            <ShortcutRow keys={['g', 'g']} label="First item" />
            <ShortcutRow keys={['G']} label="Last item" />
            <ShortcutRow keys={['h']} label="Previous tab" />
            <ShortcutRow keys={['l']} label="Next tab" />
          </Section>

          <Section title="Jump to tab">
            <ShortcutRow keys={['g', '1']} label="Inbox" />
            <ShortcutRow keys={['g', '2']} label="All" />
            <ShortcutRow keys={['g', '3']} label="Collections" />
            <ShortcutRow keys={['g', '4']} label="Archive" />
            <ShortcutRow keys={['g', 's']} label="Settings" />
          </Section>

          <Section title="Item actions">
            <ShortcutRow keys={['o']} label="Open item" />
            <ShortcutRow keys={['e']} label="Edit item" />
            <ShortcutRow keys={['a']} label="Archive / unarchive" />
            <ShortcutRow keys={['x']} label="Delete item" />
          </Section>

          <Section title="Filters">
            <ShortcutRow keys={['f', 's']} label="Sort" />
            <ShortcutRow keys={['f', 't']} label="Filter by type" />
            <ShortcutRow keys={['f', 'g']} label="Group by" />
          </Section>

          <Section title="Global">
            <ShortcutRow keys={['/']} label="Search" />
            <ShortcutRow keys={['?']} label="Toggle this overlay" />
            <ShortcutRow keys={['Esc']} label="Deselect / close" />
          </Section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
