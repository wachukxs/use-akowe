# Message files (i18n)

Messages are split by **locale** and **namespace** so files stay small and easy to maintain.

## Structure

```
messages/
  en/
    common.json    # Shared UI: nav, buttons, labels
    home.json      # Home/landing page
    metadata.json  # SEO: title, description
  ja/
    common.json
    home.json
    metadata.json
  ko/
    ...
```

## Adding a new locale

1. Create `messages/{locale}/` with the same JSON files as `en/` (common, home, metadata).
2. Add the locale in `i18n/routing.ts` and in `components/LocaleSwitcher.tsx` (labels + flags).

## Adding a new namespace

1. Create `messages/en/{namespace}.json` (and for each locale: ja, ko, …).
2. Add the namespace name to the `namespaces` array in `i18n/request.ts`.
3. Use it in components: `useTranslations('namespace')` or `getTranslations('namespace')`.

## Adding keys to an existing namespace

Edit the right `messages/{locale}/{namespace}.json` and add the key in every locale file so no locale is missing it.
