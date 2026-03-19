'use client';

const SHORTCUT_GROUPS = [
  {
    group: 'Navigation',
    rows: [
      { keys: ['j'], label: 'Next item' },
      { keys: ['k'], label: 'Previous item' },
      { keys: ['g', 'g'], label: 'First item' },
      { keys: ['G'], label: 'Last item' },
      { keys: ['h'], label: 'Previous tab' },
      { keys: ['l'], label: 'Next tab' },
    ],
  },
  {
    group: 'Jump to tab',
    rows: [
      { keys: ['g', '1'], label: 'Inbox' },
      { keys: ['g', '2'], label: 'All' },
      { keys: ['g', '3'], label: 'Collections' },
      { keys: ['g', '4'], label: 'Archive' },
      { keys: ['g', 's'], label: 'Settings' },
    ],
  },
  {
    group: 'Item actions',
    rows: [
      { keys: ['o'], label: 'Open selected item in new tab' },
      { keys: ['e'], label: 'Edit selected item' },
      { keys: ['a'], label: 'Archive / unarchive selected item' },
      { keys: ['x'], label: 'Delete selected item' },
    ],
  },
  {
    group: 'Filters',
    rows: [
      { keys: ['f', 's'], label: 'Open sort dropdown' },
      { keys: ['f', 't'], label: 'Open type filter' },
      { keys: ['f', 'g'], label: 'Open group by dropdown' },
    ],
  },
  {
    group: 'Global',
    rows: [
      { keys: ['/'], label: 'Focus search bar' },
      { keys: ['?'], label: 'Toggle shortcuts overlay' },
      { keys: ['Esc'], label: 'Deselect item / close overlay' },
    ],
  },
];

export default function ShortcutsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
          Keyboard shortcuts
        </h1>
        <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
          Navigate Hako without leaving the keyboard. Chord shortcuts (like{' '}
          <kbd className="rounded border border-stone-200 bg-stone-100 px-1 py-0.5 font-mono text-[11px] text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
            g
          </kbd>{' '}
          +{' '}
          <kbd className="rounded border border-stone-200 bg-stone-100 px-1 py-0.5 font-mono text-[11px] text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
            1
          </kbd>
          ) require pressing the second key within 1 second.
        </p>
      </div>

      <div className="space-y-4">
        {SHORTCUT_GROUPS.map(({ group, rows }) => (
          <div
            key={group}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
          >
            <div className="border-b border-stone-100 px-6 py-4 dark:border-stone-800">
              <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">{group}</h2>
            </div>
            <div className="divide-y divide-stone-50 px-6 dark:divide-stone-800/60">
              {rows.map(({ keys, label }) => (
                <div key={label} className="flex items-center justify-between gap-4 py-3">
                  <span className="text-sm text-stone-600 dark:text-stone-400">{label}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    {keys.map((k, i) => (
                      <kbd
                        // biome-ignore lint/suspicious/noArrayIndexKey: static shortcut key list, never reordered
                        key={i}
                        className="inline-flex min-w-[1.75rem] items-center justify-center rounded border border-stone-200 bg-stone-50 px-1.5 py-1 font-mono text-xs text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
