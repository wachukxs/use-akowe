import { MetadataRoute } from 'next';
import { getAllGuideSlugs } from '@/lib/seo/guides';
import { getAllCitationStyleSlugs } from '@/lib/seo/citation-styles';
import { getAllTemplateSlugs } from '@/lib/seo/templates';
import { getAllCitationSourceCombinationsScaled } from '@/lib/seo/citation-sources';
import { getAllFAQSlugs } from '@/lib/seo/faqs';
import { getAllComparisonSlugs } from '@/lib/seo/comparisons';
import { getAllKeywordSlugs } from '@/lib/seo/keywords';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';
  // All SEO pages live under the /en locale prefix (localePrefix: 'always')
  const prefix = `${baseUrl}/en`;

  // Static public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${prefix}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${prefix}/latex-guide`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    // Index pages
    {
      url: `${prefix}/guides`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${prefix}/templates`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${prefix}/citation-styles`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${prefix}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${prefix}/compare`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    // New keyword-based index pages
    {
      url: `${prefix}/methods`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${prefix}/topics`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${prefix}/fields`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${prefix}/citations`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${prefix}/guides-keywords`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${prefix}/templates-keywords`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${prefix}/compare-keywords`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${prefix}/faq-keywords`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
  ];

  // Programmatic SEO pages - Guides
  const guideRoutes: MetadataRoute.Sitemap = getAllGuideSlugs().map((slug) => ({
    url: `${prefix}/guides/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Programmatic SEO pages - Citation Styles
  const citationStyleRoutes: MetadataRoute.Sitemap = getAllCitationStyleSlugs().map((style) => ({
    url: `${prefix}/citation-styles/${style}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Programmatic SEO pages - Templates
  const templateRoutes: MetadataRoute.Sitemap = getAllTemplateSlugs().map((type) => ({
    url: `${prefix}/templates/${type}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Programmatic SEO pages - Citation Sources (highly targeted long-tail)
  const citationSourceRoutes: MetadataRoute.Sitemap = getAllCitationSourceCombinationsScaled().map(
    ({ sourceType, citationStyle }) => ({
      url: `${prefix}/citation-sources/${citationStyle}/${sourceType}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })
  );

  // Programmatic SEO pages - FAQs
  const faqRoutes: MetadataRoute.Sitemap = getAllFAQSlugs().map((slug) => ({
    url: `${prefix}/faq/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Programmatic SEO pages - Comparisons
  const comparisonRoutes: MetadataRoute.Sitemap = getAllComparisonSlugs().map((slug) => ({
    url: `${prefix}/compare/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Programmatic SEO pages - Topics (keyword-based)
  const topicSlugs = await getAllKeywordSlugs('topic');
  const topicRoutes: MetadataRoute.Sitemap = topicSlugs.map((slug: string) => ({
    url: `${prefix}/topics/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const methodologySlugs = await getAllKeywordSlugs('methodology');
  const methodologyRoutes: MetadataRoute.Sitemap = methodologySlugs.map((slug: string) => ({
    url: `${prefix}/methods/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const fieldSlugs = await getAllKeywordSlugs('field');
  const fieldRoutes: MetadataRoute.Sitemap = fieldSlugs.map((slug: string) => ({
    url: `${prefix}/fields/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Keyword-based citation pages
  const citationSlugs = await getAllKeywordSlugs('citation');
  const citationKeywordRoutes: MetadataRoute.Sitemap = citationSlugs.map((slug: string) => ({
    url: `${prefix}/citations/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Keyword-based guide pages
  const guideSlugs = await getAllKeywordSlugs('guide');
  const guideKeywordRoutes: MetadataRoute.Sitemap = guideSlugs.map((slug: string) => ({
    url: `${prefix}/guides-keywords/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Keyword-based template pages
  const templateSlugs = await getAllKeywordSlugs('template');
  const templateKeywordRoutes: MetadataRoute.Sitemap = templateSlugs.map((slug: string) => ({
    url: `${prefix}/templates-keywords/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Keyword-based FAQ pages
  const faqSlugs = await getAllKeywordSlugs('faq');
  const faqKeywordRoutes: MetadataRoute.Sitemap = faqSlugs.map((slug: string) => ({
    url: `${prefix}/faq-keywords/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Keyword-based comparison pages
  const comparisonSlugs = await getAllKeywordSlugs('comparison');
  const comparisonKeywordRoutes: MetadataRoute.Sitemap = comparisonSlugs.map((slug: string) => ({
    url: `${prefix}/compare-keywords/${slug}`,
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
        url: `${prefix}/combinations/${style}/${purpose}`,
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
    ...combinationRoutes,
  ];
}
