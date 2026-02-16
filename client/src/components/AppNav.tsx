'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { getApiBase } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { ThemePreference } from '@/lib/theme';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6 max-[1440px]:px-3 max-[1440px]:py-2.5">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 dark:text-slate-400 max-[1440px]:text-[11px]"
          >
            Sales Tax Service
          </Link>
          <div className="hidden items-center gap-3 lg:flex max-[1440px]:gap-2">
            <ul className="flex items-center gap-2 max-[1440px]:gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const linkClass = cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition max-[1440px]:px-2 max-[1440px]:py-1.5 max-[1440px]:text-xs',
                  isActive
                    ? 'bg-slate-200 text-slate-950 dark:bg-slate-200 dark:text-slate-950'
                    : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                );

                return (
                  <li key={item.href}>
                    <Link href={item.href} className={linkClass}>
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
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white max-[1440px]:px-2 max-[1440px]:py-1.5 max-[1440px]:text-xs"
                >
                  Swagger API
                </a>
              </li>
            </ul>
            <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400 max-[1440px]:gap-1.5 max-[1440px]:text-[11px]">
              Theme
              <select
                value={themePreference}
                onChange={(event) =>
                  setThemePreference(event.target.value as ThemePreference)
                }
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium normal-case tracking-normal text-slate-700 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500 max-[1440px]:px-1.5 max-[1440px]:py-0.5 max-[1440px]:text-[11px]"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
            aria-label="Open menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 7h16M4 12h16M4 17h16"
              />
            </svg>
          </button>
        </nav>
      </header>
      {isMobileMenuOpen ? (
        <div
          id="mobile-nav-menu"
          className="fixed inset-0 z-[70] bg-slate-950/95 text-slate-100 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-6 py-6">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sales Tax Service
              </Link>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                aria-label="Close menu"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <ul className="mt-8 flex flex-col gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'block rounded-lg px-4 py-3 text-lg font-medium transition',
                        isActive
                          ? 'bg-slate-200 text-slate-950'
                          : 'text-slate-100 hover:bg-slate-800',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-auto space-y-4 border-t border-slate-800 pt-6">
              <a
                href={swaggerHref}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-slate-700 px-4 py-3 text-base font-medium text-slate-100 transition hover:bg-slate-800"
              >
                Swagger API
              </a>
              <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-300">
                Theme
                <select
                  value={themePreference}
                  onChange={(event) =>
                    setThemePreference(event.target.value as ThemePreference)
                  }
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-100 focus:border-slate-500 focus:outline-none"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
