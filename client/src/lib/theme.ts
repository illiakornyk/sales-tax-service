export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme-preference';
export const SYSTEM_DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

export function resolveTheme(
  preference: ThemePreference,
  prefersDark: boolean,
): 'light' | 'dark' {
  if (preference === 'system') {
    return prefersDark ? 'dark' : 'light';
  }
  return preference;
}

export function applyTheme(preference: ThemePreference): void {
  if (typeof window === 'undefined') {
    return;
  }

  const prefersDark = window.matchMedia(SYSTEM_DARK_MEDIA_QUERY).matches;
  const resolved = resolveTheme(preference, prefersDark);

  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.setAttribute('data-theme-preference', preference);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.colorScheme = resolved;
}

export function readThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }

  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' || saved === 'system'
      ? saved
      : 'system';
  } catch {
    return 'system';
  }
}

export function writeThemePreference(preference: ThemePreference): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Ignore storage write failures (private mode / restricted policies).
  }
}

export function getThemeInitScript(): string {
  return `
(() => {
  const key = '${THEME_STORAGE_KEY}';
  const stored = localStorage.getItem(key);
  const preference =
    stored === 'light' || stored === 'dark' || stored === 'system'
      ? stored
      : 'system';

  const isDark = window.matchMedia('${SYSTEM_DARK_MEDIA_QUERY}').matches;
  const resolved = preference === 'system' ? (isDark ? 'dark' : 'light') : preference;

  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.setAttribute('data-theme-preference', preference);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.colorScheme = resolved;
})();
`;
}
