'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface RelatedItem {
  title: string;
  href: string;
  description?: string;
}

interface RelatedContentProps {
  title?: string;
  items: RelatedItem[];
  type?: 'guides' | 'templates' | 'styles' | 'faqs' | 'comparisons';
}

export function RelatedContent({ title, items, type }: RelatedContentProps) {
  const t = useTranslations('components.relatedContent');
  void type;
  if (items.length === 0) return null;

  return (
    <div className="mt-12 border-t-[4px] border-[hsl(var(--border-strong))] pt-8">
      <h2 className="text-2xl font-bold mb-6">{title ?? t('defaultTitle')}</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {items.slice(0, 6).map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-bold mb-2 group-hover:text-[hsl(var(--primary))] transition-colors">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
              <ArrowRight
                size={20}
                className="text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] flex-shrink-0 transition-colors"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

