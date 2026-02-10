import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es', 'ja', 'ko'],
  defaultLocale: 'en',
  localePrefix: 'always',
});
