'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, useCallback } from 'react';

type ThemeMode = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'theme-mode';

/** KST(UTC+9) 기준 18:00~05:59 → 밤 */
function isNightInKorea(): boolean {
  const now = new Date();
  const kstHour = (now.getUTCHours() + 9) % 24;
  return kstHour >= 18 || kstHour < 6;
}

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ThemeMode>('auto');

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved && ['auto', 'light', 'dark'].includes(saved)) {
      setMode(saved);
    }
  }, []);

  const applyAutoTheme = useCallback(() => {
    setTheme(isNightInKorea() ? 'dark' : 'light');
  }, [setTheme]);

  useEffect(() => {
    if (!mounted) return;

    if (mode === 'auto') {
      applyAutoTheme();
      const interval = setInterval(applyAutoTheme, 60_000);
      return () => clearInterval(interval);
    } else {
      setTheme(mode);
    }
  }, [mode, mounted, setTheme, applyAutoTheme]);

  function cycleMode() {
    const next: ThemeMode = mode === 'auto' ? 'light' : mode === 'light' ? 'dark' : 'auto';
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  const isDark = theme === 'dark';

  // Auto icon (clock), Sun icon, Moon icon
  const icon =
    mode === 'auto' ? (
      // Clock icon for auto mode
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ) : isDark ? (
      // Sun icon (click to go back to auto)
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    ) : (
      // Moon icon
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
      </svg>
    );

  const label =
    mode === 'auto'
      ? `Auto (KST ${isDark ? 'Night' : 'Day'})`
      : mode === 'light'
        ? 'Light'
        : 'Dark';

  if (!mounted) {
    return (
      <button className="rounded-md border border-gray-300 dark:border-gray-600 p-1.5 text-gray-600 dark:text-gray-400" aria-label="Toggle theme">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={cycleMode}
      className="rounded-md border border-gray-300 dark:border-gray-600 p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}
