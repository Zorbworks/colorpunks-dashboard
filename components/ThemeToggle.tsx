'use client';

import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label="Toggle light/dark theme"
      title="Toggle theme"
    >
      {theme === 'light' ? '◐' : '◑'}
    </button>
  );
}
