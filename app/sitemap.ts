import { MetadataRoute } from 'next';
import { getAllGuideSlugs } from '@/lib/seo/guides';
import { getAllCitationStyleSlugs } from '@/lib/seo/citation-styles';
import { getAllTemplateSlugs } from '@/lib/seo/templates';
import { getAllCitationSourceCombinationsScaled } from '@/lib/seo/citation-sources';
import { getAllFAQSlugs } from '@/lib/seo/faqs';
import { getAllComparisonSlugs } from '@/lib/seo/comparisons';
// TODO: Import keyword pages when implemented
// import { getAllKeywordSlugs } from '@/lib/seo/keywords';

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

  // Programmatic SEO pages - Topics (keyword-based, for scaling to 20k+)
  const { getAllKeywordSlugs } = require('@/lib/seo/keywords');
  
  const topicRoutes: MetadataRoute.Sitemap = getAllKeywordSlugs('topic').map((slug: string) => ({
    url: `${baseUrl}/topics/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const methodologyRoutes: MetadataRoute.Sitemap = getAllKeywordSlugs('methodology').map((slug: string) => ({
    url: `${baseUrl}/methods/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const fieldRoutes: MetadataRoute.Sitemap = getAllKeywordSlugs('field').map((slug: string) => ({
    url: `${baseUrl}/fields/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Keyword-based citation pages
  const citationKeywordRoutes: MetadataRoute.Sitemap = getAllKeywordSlugs('citation').map((slug: string) => ({
    url: `${baseUrl}/citations/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Keyword-based guide pages
  const guideKeywordRoutes: MetadataRoute.Sitemap = getAllKeywordSlugs('guide').map((slug: string) => ({
    url: `${baseUrl}/guides-keywords/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Keyword-based template pages
  const templateKeywordRoutes: MetadataRoute.Sitemap = getAllKeywordSlugs('template').map((slug: string) => ({
    url: `${baseUrl}/templates-keywords/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Keyword-based FAQ pages
  const faqKeywordRoutes: MetadataRoute.Sitemap = getAllKeywordSlugs('faq').map((slug: string) => ({
    url: `${baseUrl}/faq-keywords/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Keyword-based comparison pages
  const comparisonKeywordRoutes: MetadataRoute.Sitemap = getAllKeywordSlugs('comparison').map((slug: string) => ({
    url: `${baseUrl}/compare-keywords/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Combination pages (citation style + purpose)
  const validPurposes = [
    'students',
    'researchers',
    'graduate-students',
    'undergraduate-students',
    'phd-students',
    'research-papers',
    'thesis',
    'dissertation',
    'essays',
    'literature-review',
    'case-study',
    'qualitative-research',
    'quantitative-research',
    'academic-papers',
    'journal-articles',
    'conference-papers',
    'grant-proposals',
    'systematic-reviews',
    'meta-analysis',
    'mixed-methods-research',
    'experimental-research',
    'survey-research',
    'interview-research',
    'observational-research',
    'action-research',
    'ethnographic-research',
    'phenomenological-research',
    'grounded-theory-research',
    'narrative-research',
    'historical-research',
    'archival-research',
    'content-analysis',
    'discourse-analysis',
    'textual-analysis',
  ];
  const combinationRoutes: MetadataRoute.Sitemap = [];
  const allStyleSlugs = getAllCitationStyleSlugs();
  for (const style of allStyleSlugs) {
    for (const purpose of validPurposes) {
      combinationRoutes.push({
        url: `${baseUrl}/combinations/${style}/${purpose}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      });
    }
  }

  return [
    ...staticRoutes,
    ...guideRoutes,
    ...citationStyleRoutes,
    ...templateRoutes,
    ...citationSourceRoutes,
    ...faqRoutes,
    ...comparisonRoutes,
    ...topicRoutes,
    ...methodologyRoutes,
    ...fieldRoutes,
    ...citationKeywordRoutes,
    ...guideKeywordRoutes,
    ...templateKeywordRoutes,
    ...faqKeywordRoutes,
    ...comparisonKeywordRoutes,
  ];
}

