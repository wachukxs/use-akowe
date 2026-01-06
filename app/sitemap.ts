import { MetadataRoute } from 'next';
import { getAllGuideSlugs } from '@/lib/seo/guides';
import { getAllCitationStyleSlugs } from '@/lib/seo/citation-styles';
import { getAllTemplateSlugs } from '@/lib/seo/templates';
import { getAllCitationSourceCombinationsScaled } from '@/lib/seo/citation-sources';
import { getAllFAQSlugs } from '@/lib/seo/faqs';
import { getAllComparisonSlugs } from '@/lib/seo/comparisons';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

  // Static public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/latex-guide`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    // Index pages
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/templates`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/citation-styles`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
  ];

  // Programmatic SEO pages - Guides
  const guideRoutes: MetadataRoute.Sitemap = getAllGuideSlugs().map((slug) => ({
    url: `${baseUrl}/guides/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Programmatic SEO pages - Citation Styles
  const citationStyleRoutes: MetadataRoute.Sitemap = getAllCitationStyleSlugs().map((style) => ({
    url: `${baseUrl}/citation-styles/${style}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Programmatic SEO pages - Templates
  const templateRoutes: MetadataRoute.Sitemap = getAllTemplateSlugs().map((type) => ({
    url: `${baseUrl}/templates/${type}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Programmatic SEO pages - Citation Sources (highly targeted long-tail)
  // Using scaled function for maximum coverage
  const citationSourceRoutes: MetadataRoute.Sitemap = getAllCitationSourceCombinationsScaled().map(
    ({ sourceType, citationStyle }) => ({
      url: `${baseUrl}/citation-sources/${citationStyle}/${sourceType}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8, // High priority for long-tail keywords
    })
  );

  // Programmatic SEO pages - FAQs
  const faqRoutes: MetadataRoute.Sitemap = getAllFAQSlugs().map((slug) => ({
    url: `${baseUrl}/faq/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Programmatic SEO pages - Comparisons
  const comparisonRoutes: MetadataRoute.Sitemap = getAllComparisonSlugs().map((slug) => ({
    url: `${baseUrl}/compare/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8, // High priority for comparison keywords
  }));

  return [
    ...staticRoutes,
    ...guideRoutes,
    ...citationStyleRoutes,
    ...templateRoutes,
    ...citationSourceRoutes,
    ...faqRoutes,
    ...comparisonRoutes,
  ];
}

