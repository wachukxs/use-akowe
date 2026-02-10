import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { generateSEOMetadata } from '@/lib/seo/metadata';
import { generateWebPageSchema } from '@/lib/seo/schema';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { getBreadcrumbStructuredData } from '@/lib/seo/breadcrumb-structured-data';
import { RelatedContent } from '@/components/seo/RelatedContent';
import { getAllKeywordSlugs, getKeywordPageBySlug } from '@/lib/seo/keywords';

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const keywordPage = await getKeywordPageBySlug(slug);
  
  if (!keywordPage || keywordPage.category !== 'comparison') {
    return {
      title: 'Comparison Not Found',
    };
  }
  
  return generateSEOMetadata({
    title: keywordPage.title,
    description: keywordPage.description,
    keywords: keywordPage.keywords,
    path: `/compare-keywords/${slug}`,
    type: 'article',
  });
}

export default async function ComparisonKeywordPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const keywordPage = await getKeywordPageBySlug(slug);
  
  if (!keywordPage || keywordPage.category !== 'comparison') {
    notFound();
  }
  
  const title = keywordPage.title;
  
  const breadcrumbData = getBreadcrumbStructuredData(
    [
      { label: 'Comparisons', href: '/compare' },
      { label: title, href: `/compare-keywords/${slug}` },
    ],
    baseUrl
  );

  const comparisonSlugs = await getAllKeywordSlugs('comparison');
  const comparisonPages = await Promise.all(comparisonSlugs.map((s) => getKeywordPageBySlug(s)));
  const allComparisonKeywords = comparisonPages
    .filter((k): k is NonNullable<typeof k> => k != null && k.slug !== slug)
    .slice(0, 6) as Array<{ slug: string; title: string; description: string }>;

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
            { label: 'Comparisons', href: '/compare' },
            { label: title, href: `/compare-keywords/${slug}` },
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
              url: `${baseUrl}/compare-keywords/${slug}`,
              title: title,
              description: keywordPage.description,
            })),
          }}
        />
        
        <article className="prose prose-lg max-w-none">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-4">
              <GitCompare size={16} />
              <span>Comparison Guide</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">{title}</h1>
            <p className="text-xl text-[hsl(var(--muted-foreground))]">
              {keywordPage.description}
            </p>
          </div>

          {keywordPage.content?.introduction && (
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg mb-8">
              <p className="text-lg leading-relaxed">{keywordPage.content.introduction}</p>
            </div>
          )}

          {keywordPage.content?.sections && keywordPage.content.sections.length > 0 && (
            <div className="space-y-8">
              {keywordPage.content.sections.map((section, index) => (
                <section key={index} className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                  <h2 className="text-2xl font-bold mb-4">{section.heading}</h2>
                  <p className="text-base leading-relaxed">{section.content}</p>
                </section>
              ))}
            </div>
          )}

          {!keywordPage.content?.introduction && !keywordPage.content?.sections && (
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg mb-8">
              <p className="text-lg leading-relaxed">
                {keywordPage.description}
              </p>
            </div>
          )}

          {allComparisonKeywords.length > 0 && (
            <div className="mt-12">
              <RelatedContent
                title="Related Comparisons"
                items={allComparisonKeywords.map((k) => ({
                  title: k.title,
                  description: k.description,
                  href: `/compare-keywords/${k.slug}`,
                }))}
              />
            </div>
          )}

          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] p-6 rounded-lg mt-8">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Writing?</h2>
            <p className="mb-6 text-lg leading-relaxed">
              Use Akowe to apply these comparisons in your own research. Get AI-powered writing assistance, 
              manage citations automatically, and ensure academic integrity—all in one workspace.
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] px-6 py-3 font-semibold uppercase tracking-[0.18em]"
            >
              Start Writing with Akowe
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
