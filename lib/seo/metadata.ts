import { Metadata } from 'next';

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

// Must match i18n/routing.ts locales
const locales = ['de', 'en', 'es', 'fr', 'ja', 'ko', 'pt-BR', 'pt-PT', 'th', 'vi', 'zh'] as const;

export interface SEOMetadataOptions {
  title: string;
  description: string;
  keywords?: string[];
  path: string;
  ogImage?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * Generate comprehensive SEO metadata with canonical URLs
 */
export function generateSEOMetadata(options: SEOMetadataOptions): Metadata {
  const {
    title,
    description,
    keywords = [],
    path,
    ogImage = `${baseUrl}/og-image.png`,
    type = 'website',
    publishedTime,
    modifiedTime,
  } = options;

  // Ensure canonical URL includes the /en locale prefix (localePrefix: 'always')
  const localePath = path.startsWith('/en/') || path === '/en' ? path : `/en${path}`;
  const url = `${baseUrl}${localePath}`;
  const fullTitle = title.includes('Akowe') ? title : `${title} | Akowe`;

  // Build hreflang alternate links for all supported locales.
  // This tells Google these locale URLs are language variants of the same content
  // and resolves "Duplicate without user-selected canonical" GSC warnings.
  // Normalize path: strip any existing /en/ or /{locale}/ prefix so we can
  // rebuild locale-specific URLs correctly.
  const normalisedPath = path.replace(/^\/(de|en|es|fr|ja|ko|pt-BR|pt-PT|th|vi|zh)(\/|$)/, '/').replace(/^(?!\/)/, '/');
  const hreflangLanguages: Record<string, string> = {};
  for (const locale of locales) {
    hreflangLanguages[locale] = `${baseUrl}/${locale}${normalisedPath}`;
  }
  // x-default points to the canonical English version
  hreflangLanguages['x-default'] = url;

  return {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical: url,
      languages: hreflangLanguages,
    },
    openGraph: {
      type,
      url,
      title: fullTitle,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}
