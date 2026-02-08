'use client';

import Link from 'next/link';

/**
 * Root not-found: used when the URL doesn't match [locale] (e.g. /random-path).
 * No NextIntlClientProvider here, so no translations or components that use useTranslations.
 * For locale-prefixed 404s (e.g. /en/missing), Next.js uses app/[locale]/not-found.tsx instead.
 */
export default function RootNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <h1 className="text-2xl font-bold">404</h1>
      <p className="text-[hsl(var(--muted-foreground))]">Page not found.</p>
      <Link
        href="/"
        className="text-[hsl(var(--primary))] font-medium hover:underline"
      >
        Go to home
      </Link>
    </div>
  );
}
