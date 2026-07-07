'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/themeStore';

export default function ThemeProvider() {
  const { setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check local storage for theme preference or default to light
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    setMounted(true);
  }, [setTheme]);

  if (!mounted) return null;
  return null;
}
