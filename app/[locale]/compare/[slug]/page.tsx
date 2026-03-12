import { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { GitCompare, Check, X } from 'lucide-react';
import { getAllComparisonSlugs, getComparisonBySlug } from '@/lib/seo/comparisons';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { getBreadcrumbStructuredData } from '@/lib/seo/breadcrumb-structured-data';
import { RelatedContent } from '@/components/seo/RelatedContent';
import { generateSEOMetadata } from '@/lib/seo/metadata';
import { generateWebPageSchema } from '@/lib/seo/schema';

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const comparison = getComparisonBySlug(slug);

  if (!comparison) {
    return {
      title: 'Comparison Not Found - Akowe',
    };
  }

  const metadata = generateSEOMetadata({
    title: comparison.title,
    description: comparison.description,
    keywords: comparison.keywords,
    path: `/compare/${slug}`,
  });

  if (locale !== 'en') {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comparison = getComparisonBySlug(slug);

  if (!comparison) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-2xl font-bold mb-4">Comparison Not Found</h1>
          <Link href="/compare" className="text-[hsl(var(--primary))] underline">
            Back to Comparisons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="sticky top-0 z-50 border-b-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-xl font-bold uppercase tracking-[0.16em]">
                Akowe
              </span>
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
            { label: 'Comparisons', href: '/compare' },
            { label: comparison.title, href: `/compare/${slug}` },
          ] as Array<{ label: string; href: string }>}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getBreadcrumbStructuredData(
              [
                { label: 'Comparisons', href: '/compare' },
                { label: comparison.title, href: `/compare/${slug}` },
              ],
              baseUrl
            )),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateWebPageSchema({
              url: `${baseUrl}/compare/${slug}`,
              title: comparison.title,
              description: comparison.description,
            })),
          }}
        />

        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-4">
            <GitCompare size={16} />
            <span>Tool Comparison</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">{comparison.title}</h1>
          <p className="text-xl text-[hsl(var(--muted-foreground))]">{comparison.description}</p>
        </div>

        <div className="space-y-8">
          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Why Choose Akowe?</h2>
            <ul className="space-y-3">
              {comparison.akoweAdvantages.map((advantage, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span>{advantage}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">{comparison.competitor} Limitations</h2>
            <ul className="space-y-3">
              {comparison.competitorLimitations.map((limitation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <X className="text-red-500 flex-shrink-0 mt-1" size={20} />
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Which Should You Choose?</h2>
            <p className="text-lg leading-relaxed">{comparison.useCase}</p>
          </div>
        </div>

        {/* Related comparisons */}
        {(() => {
          const allComparisons = getAllComparisonSlugs()
            .map((s) => getComparisonBySlug(s))
            .filter((c) => c && c.slug !== slug)
            .slice(0, 6);

          const relatedComparisons = allComparisons.map((c) => ({
            title: c!.title,
            href: `/compare/${c!.slug}`,
            description: c!.description,
          }));

          return relatedComparisons.length > 0 ? (
            <RelatedContent
              title="More Tool Comparisons"
              items={relatedComparisons}
              type="comparisons"
            />
          ) : null;
        })()}

        <div className="mt-12 border-t border-[hsl(var(--border-strong))] pt-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-6 py-3 font-semibold uppercase tracking-[0.18em] text-sm hover:opacity-90"
            >
              Try Akowe Free
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] px-6 py-3 font-semibold uppercase tracking-[0.18em] text-sm hover:opacity-90"
            >
              View More Comparisons
            </Link>
          </div>
        </div>

        <div className="mt-8 text-sm text-[hsl(var(--muted-foreground))]">
          <p>
            <Link href="/guides" className="underline">Writing guides</Link> |{' '}
            <Link href="/templates" className="underline">Templates</Link> |{' '}
            <Link href="/citation-styles" className="underline">Citation styles</Link> |{' '}
            <Link href="/" className="underline">Home</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

