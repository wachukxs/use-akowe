'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('common');
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <h1 className="text-2xl font-bold">404</h1>
      <p className="text-[hsl(var(--muted-foreground))]">{t('notFound')}</p>
      <Link
        href="/"
        className="text-[hsl(var(--primary))] font-medium hover:underline"
      >
        {t('backTo')} {t('brandTitle')}
      </Link>
    </div>
  );
}
