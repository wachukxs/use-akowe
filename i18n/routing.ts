import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['de', 'en', 'es', 'fr', 'ja', 'ko', 'pt-BR', 'pt-PT', 'th', 'vi', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'always',
});
