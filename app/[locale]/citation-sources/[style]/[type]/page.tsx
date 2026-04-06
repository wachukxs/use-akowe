import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import { getCitationSourceByTypeAndStyle, getAllCitationSourceCombinationsScaled } from '@/lib/seo/citation-sources';
import { getCitationStyleBySlug, getAllCitationStyleSlugs } from '@/lib/seo/citation-styles';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { getBreadcrumbStructuredData } from '@/lib/seo/breadcrumb-structured-data';
import { RelatedContent } from '@/components/seo/RelatedContent';
import { generateSEOMetadata } from '@/lib/seo/metadata';
import { generateWebPageSchema } from '@/lib/seo/schema';

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

// All pSEO pages generated on-demand; cache for 24h (ISR)
export const dynamicParams = true;
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; style: string; type: string }>;
}): Promise<Metadata> {
  const { locale, style, type } = await params;
  const citationSource = getCitationSourceByTypeAndStyle(type, style);
  const citationStyle = getCitationStyleBySlug(style);

  if (!citationSource || !citationStyle) {
    return {
      robots: { index: false, follow: false },
    };
  }

  const metadata = generateSEOMetadata({
    title: citationSource.title,
    description: citationSource.description,
    keywords: citationSource.keywords,
    path: `/citation-sources/${style}/${type}`,
  });

  // Non-English pages have canonical pointing to /en/..., so explicitly mark
  // them noindex to prevent GSC "Crawled - not indexed" noise and save crawl budget.
  if (locale !== 'en') {
    return { robots: { index: false, follow: false }, alternates: { canonical: metadata.alternates?.canonical } };
  }
  if (metadata.alternates) {
    metadata.alternates = { canonical: metadata.alternates.canonical };
  }

  return metadata;
}

export default async function CitationSourcePage({
  params,
}: {
  params: Promise<{ locale: string; style: string; type: string }>;
}) {
  const { locale, style, type } = await params;
  const citationSource = getCitationSourceByTypeAndStyle(type, style);
  const citationStyle = getCitationStyleBySlug(style);

  if (!citationStyle || !citationSource) {
    notFound();
  }

  const sourceTypeName = type.charAt(0).toUpperCase() + type.slice(1);

  // Get related citation sources (same style, different types)
  const allCombinations = getAllCitationSourceCombinationsScaled();
  const relatedSources = allCombinations
    .filter((c) => c.citationStyle === style && c.sourceType !== type)
    .slice(0, 6)
    .map((c) => {
      const related = getCitationSourceByTypeAndStyle(c.sourceType, c.citationStyle);
      if (!related) return null;
      return {
        title: related.title,
        href: `/citation-sources/${c.citationStyle}/${c.sourceType}`,
        description: related.description,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Get other citation styles for same source type
  const otherStyles = getAllCitationStyleSlugs()
    .filter((s: string) => s !== style)
    .slice(0, 3)
    .map((s: string) => {
      const styleInfo = getCitationStyleBySlug(s);
      const source = getCitationSourceByTypeAndStyle(type, s);
      if (!styleInfo || !source) return null;
      return {
        title: `How to Cite ${sourceTypeName} in ${styleInfo.name}`,
        href: `/citation-sources/${s}/${type}`,
        description: source.description,
      };
    })
    .filter((item: any): item is NonNullable<typeof item> => item !== null);

  const breadcrumbData = getBreadcrumbStructuredData(
    [
      { label: 'Citation Styles', href: '/citation-styles' },
      { label: citationStyle.name, href: `/citation-styles/${style}` },
      { label: sourceTypeName, href: `/citation-sources/${style}/${type}` },
    ],
    baseUrl
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="sticky top-0 z-50 border-b-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[4px_4px_0_rgba(29,41,57,0.12)]">
                <ArrowLeft size={18} />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs uppercase tracking-[0.36em] text-[hsl(var(--muted-foreground))]">
                  Back to
                </span>
                <span className="text-xl font-bold uppercase tracking-[0.16em]">
                  Akowe
                </span>
              </div>
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 py-2.5 font-semibold uppercase tracking-[0.18em] text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <Breadcrumbs
          items={[
            { label: 'Citation Styles', href: '/citation-styles' },
            { label: citationStyle.name, href: `/citation-styles/${style}` },
            { label: sourceTypeName, href: `/citation-sources/${style}/${type}` },
          ] as Array<{ label: string; href: string }>}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateWebPageSchema({
              url: `${baseUrl}/en/citation-sources/${style}/${type}`,
              title: citationSource.title,
              description: citationSource.description,
            })),
          }}
        />
        <article className="prose prose-lg max-w-none">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-4">
              <FileText size={16} />
              <span>
                {citationStyle.name} Citation Guide - {sourceTypeName}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">{citationSource.title}</h1>
            <p className="text-xl text-[hsl(var(--muted-foreground))]">{citationSource.description}</p>
          </div>

          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4">Citation Format</h2>
            <div className="bg-[hsl(var(--background))] p-4 rounded border-2 border-[hsl(var(--border-strong))] mb-4">
              <code className="text-sm">{citationSource.format}</code>
            </div>
            <h2 className="text-2xl font-bold mb-4">Example</h2>
            <div className="bg-[hsl(var(--background))] p-4 rounded border-2 border-[hsl(var(--border-strong))]">
              <code className="text-sm">{citationSource.example}</code>
            </div>
          </div>

          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4">Important Notes</h2>
            <ul className="list-disc list-inside space-y-3">
              {citationSource.notes.map((note, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-[hsl(var(--primary))] mt-1 flex-shrink-0" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Automate Your Citations</h2>
            <p className="mb-6 text-lg leading-relaxed">
              Don&apos;t memorize citation formats. Use Akowe to automatically cite {type}s in {citationStyle.name} style.
              Search real academic sources, add them to your paper, and Akowe formats them correctly—every time.
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] px-6 py-3 font-semibold uppercase tracking-[0.18em]"
            >
              Try Akowe Free
            </Link>
          </div>

          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg mt-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.14em]">
              Are you a blogger, educator, or YouTuber who creates content for students and researchers?{' '}
              <Link href="/affiliate" className="text-[hsl(var(--foreground))] font-semibold hover:underline">
                Join the Akowe affiliate program
              </Link>
              {' '}and earn 30% recurring commission for every subscriber you refer.
            </p>
          </div>

          {relatedSources.length > 0 && (
            <RelatedContent
              title={`More ${citationStyle.name} Citation Guides`}
              items={relatedSources}
              type="styles"
            />
          )}

          {otherStyles.length > 0 && (
            <RelatedContent
              title={`${sourceTypeName} Citations in Other Styles`}
              items={otherStyles}
              type="styles"
            />
          )}

          <div className="mt-8 text-sm text-[hsl(var(--muted-foreground))]">
            <p>
              <Link href={`/citation-styles/${style}`} className="underline">
                View {citationStyle.name} style guide
              </Link>{' '}
              | <Link href="/citation-styles" className="underline">All citation styles</Link> |{' '}
              <Link href="/guides" className="underline">Writing guides</Link>
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}

