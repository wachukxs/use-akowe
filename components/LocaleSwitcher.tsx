'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { ChevronDown } from 'lucide-react';
import { routing } from '@/i18n/routing';

const localeLabels: Record<string, string> = {
  en: 'English',
  es: 'Español',
  ja: '日本語',
  ko: '한국어',
};

const localeFlags: Record<string, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  ja: '🇯🇵',
  ko: '🇰🇷',
};

function localeDisplay(loc: string) {
  const flag = localeFlags[loc] ?? '🌐';
  const label = localeLabels[loc] ?? loc;
  const iso2 = loc.toUpperCase().slice(0, 2);
  return { flag, label, iso2, full: `${flag} ${label} (${iso2})` };
}

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const locales = routing.locales as readonly string[];
  const current = localeDisplay(locale);

  return (
    <div className="relative w-fit" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] sm:tracking-[0.28em] text-[hsl(var(--foreground))] hover:text-[hsl(var(--secondary))] transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <span>{current.full}</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 min-w-40 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] shadow-[4px_4px_0_rgba(29,41,57,0.12)] py-1"
        >
          {locales.map((loc) => (
            <li key={loc} role="option" aria-selected={loc === locale}>
              <Link
                href={pathname || '/'}
                locale={loc}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] transition-colors ${
                  loc === locale
                    ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                    : ''
                }`}
              >
                {localeDisplay(loc).full}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
