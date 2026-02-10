import { Metadata } from 'next';
import Link from 'next/link';
import { GitCompare, ArrowRight } from 'lucide-react';
import { getAllComparisonSlugs, getComparisonBySlug } from '@/lib/seo/comparisons';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { getBreadcrumbStructuredData } from '@/lib/seo/breadcrumb-structured-data';

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

export const metadata: Metadata = {
  title: 'Akowe vs Other Tools - Complete Comparison Guide',
  description: 'Compare Akowe with other academic writing tools, citation managers, and AI assistants. See why Akowe is the best all-in-one solution for academic writing.',
  keywords: [
    'akowe comparison',
    'akowe vs',
    'academic writing tool comparison',
    'citation manager comparison',
    'akowe alternatives',
  ],
  openGraph: {
    title: 'Akowe vs Other Tools - Complete Comparison Guide',
    description: 'Compare Akowe with other academic writing tools, citation managers, and AI assistants.',
    url: `${baseUrl}/compare`,
  },
};

export default function CompareIndexPage() {
  const comparisonSlugs = getAllComparisonSlugs();
  const comparisons = comparisonSlugs
    .map((slug) => getComparisonBySlug(slug))
    .filter((comp): comp is NonNullable<typeof comp> => comp !== undefined);

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

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <Breadcrumbs
          items={[{ label: 'Comparisons', href: '/compare' }] as Array<{ label: string; href: string }>}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getBreadcrumbStructuredData(
              [{ label: 'Comparisons', href: '/compare' }],
              baseUrl
            )),
          }}
        />
        <div className="mb-12">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-4">
            <GitCompare size={16} />
            <span>Tool Comparisons</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Akowe vs Other Tools</h1>
          <p className="text-xl text-[hsl(var(--muted-foreground))]">
            Compare Akowe with other academic writing tools, citation managers, and AI assistants.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comparisons.map((comparison) => (
            <Link
              key={comparison.slug}
              href={`/compare/${comparison.slug}`}
              className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-bold mb-2">{comparison.title}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 line-clamp-2">
                {comparison.description}
              </p>
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--primary))]">
                <span>Read comparison</span>
                <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-sm text-[hsl(var(--muted-foreground))]">
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

