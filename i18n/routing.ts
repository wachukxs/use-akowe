import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es', 'ja', 'ko', 'pt-BR', 'pt-PT'],
  defaultLocale: 'en',
  localePrefix: 'always',
});
