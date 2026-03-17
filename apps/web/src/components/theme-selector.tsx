'use client';

import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const options: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'system', label: 'System', icon: ComputerDesktopIcon },
];

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
  if (theme === 'system') {
    localStorage.removeItem('theme');
  } else {
    localStorage.setItem('theme', theme);
  }
}

export function ThemeSelector() {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    } else {
      setTheme('system');
    }
  }, []);

  function handleSelect(value: Theme) {
    setTheme(value);
    applyTheme(value);
  }

  if (!mounted) {
    return <div className="h-10 rounded-lg bg-stone-100 dark:bg-stone-800 animate-pulse" />;
  }

  return (
    <div className="flex gap-2">
      {options.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => handleSelect(value)}
            className={[
              'flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all',
              active
                ? 'border-accent-400 bg-accent-50 text-accent-700 dark:border-accent-600 dark:bg-accent-900/20 dark:text-accent-400'
                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:border-stone-600 dark:hover:bg-stone-700',
            ].join(' ')}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
