'use client';

import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';

const localeLabels: Record<string, string> = {
  en: 'English',
  ja: '日本語',
};

export function LocaleSwitcher() {
  const locale = useLocale();
  return (
    <span className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] sm:tracking-[0.28em]">
      {(['en', 'ja'] as const).map((loc) =>
        loc === locale ? (
          <span
            key={loc}
            className="text-[hsl(var(--muted-foreground))] cursor-default"
          >
            {localeLabels[loc]}
          </span>
        ) : (
          <Link
            key={loc}
            href="/"
            locale={loc}
            className="hover:text-[hsl(var(--secondary))] transition-colors"
          >
            {localeLabels[loc]}
          </Link>
        )
      )}
    </span>
  );
}
