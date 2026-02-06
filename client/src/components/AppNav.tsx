'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/cn';

const NAV_ITEMS = [
  { href: '/', label: 'Geography' },
  { href: '/tax-rates', label: 'Tax Lookup' },
  { href: '/tax-rates/current', label: 'Current Rates' },
  { href: '/admin/tax-rates', label: 'Admin Rates' },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400"
        >
          Sales Tax Service
        </Link>
        <ul className="flex items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname?.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-slate-200 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
