'use client';

import { useEffect, useState } from 'react';
import {
  applyTheme,
  readThemePreference,
  SYSTEM_DARK_MEDIA_QUERY,
  writeThemePreference,
  type ThemePreference,
} from '@/lib/theme';

export function useThemePreference() {
  const [themePreference, setThemePreference] = useState<ThemePreference>(() =>
    readThemePreference(),
  );

  useEffect(() => {
    applyTheme(themePreference);
    writeThemePreference(themePreference);
  }, [themePreference]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(SYSTEM_DARK_MEDIA_QUERY);
    const handleSystemThemeChange = () => {
      if (themePreference === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [themePreference]);

  return { themePreference, setThemePreference };
}
