'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const t = useTranslations('components.breadcrumbs');
  const allItems = [
    { label: t('home'), href: '/' },
    ...items,
  ];

  return (
    <nav aria-label={t('ariaLabel')} className="mb-6">
      <ol className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] flex-wrap">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-2">
              {index === 0 ? (
                <Home size={14} />
              ) : (
                <ChevronRight size={14} className="text-[hsl(var(--muted-foreground))]" />
              )}
              {isLast ? (
                <span className="text-[hsl(var(--foreground))] font-medium">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-[hsl(var(--foreground))] hover:underline"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}


