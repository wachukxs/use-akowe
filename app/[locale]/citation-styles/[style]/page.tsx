import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import { getAllCitationStyleSlugs, getCitationStyleBySlug } from '@/lib/seo/citation-styles';
import { Breadcrumbs, BreadcrumbStructuredData } from '@/components/seo/Breadcrumbs';
import { RelatedContent } from '@/components/seo/RelatedContent';
import { getAllCitationSourceCombinationsScaled } from '@/lib/seo/citation-sources';
import { getCitationSourceByTypeAndStyle } from '@/lib/seo/citation-sources';
import { generateSEOMetadata } from '@/lib/seo/metadata';
import { generateWebPageSchema } from '@/lib/seo/schema';

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ style: string }> }): Promise<Metadata> {
  const { style } = await params;
  const citationStyle = getCitationStyleBySlug(style);

  if (!citationStyle) {
    return {
      title: 'Citation Style Not Found',
    };
  }

  return generateSEOMetadata({
    title: `${citationStyle.name} Citation Guide`,
    description: `Complete ${citationStyle.name} citation guide with examples for books, journals, websites, and in-text citations. Learn how to cite in ${citationStyle.name} style.`,
    keywords: citationStyle.keywords,
    path: `/citation-styles/${style}`,
  });
}

export default async function CitationStylePage({ params }: { params: Promise<{ style: string }> }) {
  const { style } = await params;
  const citationStyle = getCitationStyleBySlug(style);

  if (!citationStyle) {
    notFound();
  }

  // Get related citation sources for this style
  const allCombinations = getAllCitationSourceCombinationsScaled();
  const relatedSources = allCombinations
    .filter((c) => c.citationStyle === style)
    .slice(0, 6)
    .map((c) => {
      const source = getCitationSourceByTypeAndStyle(c.sourceType, c.citationStyle);
      if (!source) return null;
      const sourceTypeName = c.sourceType.charAt(0).toUpperCase() + c.sourceType.slice(1);
      return {
        title: `How to Cite ${sourceTypeName} in ${citationStyle.name}`,
        href: `/citation-sources/${c.citationStyle}/${c.sourceType}`,
        description: source.description,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Get other citation styles
  const otherStyles = getAllCitationStyleSlugs()
    .filter((s) => s !== style)
    .slice(0, 3)
    .map((s) => {
      const styleInfo = getCitationStyleBySlug(s);
      if (!styleInfo) return null;
      return {
        title: `${styleInfo.name} Citation Guide`,
        href: `/citation-styles/${s}`,
        description: styleInfo.description,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const breadcrumbData = BreadcrumbStructuredData({
    items: [
      { label: 'Citation Styles', href: '/citation-styles' },
      { label: citationStyle.name, href: `/citation-styles/${style}` },
    ],
  });

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="sticky top-0 z-50 border-b-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-[var(--radius)] shadow-[4px_4px_0_rgba(29,41,57,0.12)]">
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
              url: `${baseUrl}/citation-styles/${style}`,
              title: `${citationStyle.name} Citation Guide`,
              description: citationStyle.description,
            })),
          }}
        />
        <article className="prose prose-lg max-w-none">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-4">
              <FileText size={16} />
              <span>Citation Style Guide</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              {citationStyle.name} Citation Guide
            </h1>
            <p className="text-xl text-[hsl(var(--muted-foreground))] mb-2">
              {citationStyle.fullName} Style
            </p>
            <p className="text-lg">{citationStyle.description}</p>
          </div>

          <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4">Common Uses</h2>
            <ul className="list-disc list-inside space-y-2">
              {citationStyle.commonUses.map((use, index) => (
                <li key={index}>{use}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-8">
            <section className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <CheckCircle size={24} className="text-[hsl(var(--primary))]" />
                Book Citation
              </h2>
              <div className="bg-[hsl(var(--background))] p-4 rounded border-2 border-[hsl(var(--border-strong))]">
                <code className="text-sm">{citationStyle.examples.book}</code>
              </div>
            </section>

            <section className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <CheckCircle size={24} className="text-[hsl(var(--primary))]" />
                Journal Article Citation
              </h2>
              <div className="bg-[hsl(var(--background))] p-4 rounded border-2 border-[hsl(var(--border-strong))]">
                <code className="text-sm">{citationStyle.examples.journal}</code>
              </div>
            </section>

            <section className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <CheckCircle size={24} className="text-[hsl(var(--primary))]" />
                Website Citation
              </h2>
              <div className="bg-[hsl(var(--background))] p-4 rounded border-2 border-[hsl(var(--border-strong))]">
                <code className="text-sm">{citationStyle.examples.website}</code>
              </div>
            </section>

            <section className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <CheckCircle size={24} className="text-[hsl(var(--primary))]" />
                In-Text Citation
              </h2>
              <div className="bg-[hsl(var(--background))] p-4 rounded border-2 border-[hsl(var(--border-strong))]">
                <code className="text-sm">{citationStyle.examples.inText}</code>
              </div>
            </section>
          </div>

          <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] p-6 rounded-lg mt-8">
            <h2 className="text-2xl font-bold mb-4">Automate Your Citations</h2>
            <p className="mb-6 text-lg leading-relaxed">
              Don&apos;t memorize citation formats. Use Akowe to automatically format citations in {citationStyle.name} style. 
              Search real academic sources, add them to your paper, and Akowe handles the formatting—correctly, every time.
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] px-6 py-3 font-semibold uppercase tracking-[0.18em]"
            >
              Try Akowe Free
            </Link>
          </div>

          {relatedSources.length > 0 && (
            <RelatedContent
              title={`${citationStyle.name} Citation Examples`}
              items={relatedSources}
              type="styles"
            />
          )}

          {otherStyles.length > 0 && (
            <RelatedContent
              title="Other Citation Styles"
              items={otherStyles}
              type="styles"
            />
          )}

          <div className="mt-8 text-sm text-[hsl(var(--muted-foreground))]">
            <p>
              <Link href="/citation-styles" className="underline">View all citation styles</Link> |{' '}
              <Link href="/guides" className="underline">Writing guides</Link> |{' '}
              <Link href="/templates" className="underline">Templates</Link>
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}

