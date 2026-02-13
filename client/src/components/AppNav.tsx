'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useThemePreference } from '../hooks/use-theme-preference';
import { getApiBase } from '../lib/api';
import { cn } from '../lib/cn';
import type { ThemePreference } from '../lib/theme';

const NAV_ITEMS = [
  { href: '/', label: 'Geography' },
  { href: '/tax-rates', label: 'Tax Lookup' },
  { href: '/tax-rates/current', label: 'Current Rates' },
  { href: '/faq', label: 'FAQ' },
  { href: '/admin/tax-rates', label: 'Admin Rates' },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const swaggerHref = `${getApiBase()}/api`;
  const { themePreference, setThemePreference } = useThemePreference();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 dark:text-slate-400"
        >
          Sales Tax Service
        </Link>
        <div className="flex items-center gap-3">
          <ul className="flex items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const linkClass = cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition',
              isActive
                ? 'bg-slate-200 text-slate-950 dark:bg-slate-200 dark:text-slate-950'
                : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
            );

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={linkClass}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
            <li>
              <a
                href={swaggerHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Swagger API
              </a>
            </li>
          </ul>
          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400">
            Theme
            <select
              value={themePreference}
              onChange={(event) =>
                setThemePreference(event.target.value as ThemePreference)
              }
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium normal-case tracking-normal text-slate-700 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
      </nav>
    </header>
  );
}
