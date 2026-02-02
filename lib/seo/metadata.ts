import { Metadata } from 'next';

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

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

  const url = `${baseUrl}${path}`;
  const fullTitle = title.includes('Akowe') ? title : `${title} | Akowe`;

  return {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical: url,
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
