import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { generateSEOMetadata } from '@/lib/seo/metadata';
import { generateWebPageSchema } from '@/lib/seo/schema';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { getBreadcrumbStructuredData } from '@/lib/seo/breadcrumb-structured-data';
import { RelatedContent } from '@/components/seo/RelatedContent';
import { getAllCitationStyleSlugs, getCitationStyleBySlug } from '@/lib/seo/citation-styles';

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

export const revalidate = 86400;

// Valid purposes for combination pages
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

export async function generateMetadata({ params }: { params: Promise<{ style: string; purpose: string }> }): Promise<Metadata> {
  const { style, purpose } = await params;
  const citationStyle = getCitationStyleBySlug(style);
  
  if (!citationStyle || !validPurposes.includes(purpose)) {
    return {
      title: 'Citation Guide Not Found',
    };
  }
  
  const purposeName = purpose.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const title = `${citationStyle.name} Citation Guide for ${purposeName}: Complete Format Guide`;
  const description = `Complete ${citationStyle.name} citation guide specifically for ${purposeName.toLowerCase()}. Learn how to cite sources correctly in ${citationStyle.name} style for ${purposeName.toLowerCase()}. Includes examples, formats, and best practices.`;
  
  return generateSEOMetadata({
    title,
    description,
    keywords: [
      `${citationStyle.name} citation for ${purpose}`,
      `${citationStyle.name} ${purpose} guide`,
      `how to cite in ${citationStyle.name} for ${purpose}`,
      `${citationStyle.name} format ${purpose}`,
      `${citationStyle.name} citation examples ${purpose}`,
    ],
    path: `/combinations/${style}/${purpose}`,
    type: 'article',
  });
}

export default async function CombinationPage({ params }: { params: Promise<{ style: string; purpose: string }> }) {
  const { style, purpose } = await params;
  const citationStyle = getCitationStyleBySlug(style);
  
  if (!citationStyle || !validPurposes.includes(purpose)) {
    notFound();
  }
  
  const purposeName = purpose.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const title = `${citationStyle.name} Citation Guide for ${purposeName}`;
  
  const breadcrumbData = getBreadcrumbStructuredData(
    [
      { label: 'Citation Guides', href: '/citation-styles' },
      { label: citationStyle.name, href: `/citation-styles/${style}` },
      { label: title, href: `/combinations/${style}/${purpose}` },
    ],
    baseUrl
  );

  // Generate related combinations
  const allStyles = getAllCitationStyleSlugs();
  const relatedCombinations = allStyles
    .filter((s) => s !== style)
    .slice(0, 6)
    .map((s) => ({
      title: `${getCitationStyleBySlug(s)?.name} Citation Guide for ${purposeName}`,
      description: `Learn how to cite sources in ${getCitationStyleBySlug(s)?.name} style for ${purposeName.toLowerCase()}.`,
      href: `/combinations/${s}/${purpose}`,
    }));

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
            { label: 'Citation Guides', href: '/citation-styles' },
            { label: citationStyle.name, href: `/citation-styles/${style}` },
            { label: title, href: `/combinations/${style}/${purpose}` },
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
              url: `${baseUrl}/combinations/${style}/${purpose}`,
              title: title,
              description: `Complete ${citationStyle.name} citation guide for ${purposeName.toLowerCase()}.`,
            })),
          }}
        />
        
        <article className="prose prose-lg max-w-none">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-4">
              <FileText size={16} />
              <span>{citationStyle.name} Citation Guide</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">{title}</h1>
            <p className="text-xl text-[hsl(var(--muted-foreground))]">
              Complete guide to citing sources in {citationStyle.name} style specifically for {purposeName.toLowerCase()}. Learn formatting rules, examples, and best practices.
            </p>
          </div>

          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4">About {citationStyle.name} Style</h2>
            <p className="text-lg leading-relaxed mb-4">{citationStyle.description}</p>
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Common Uses:</h3>
              <ul className="list-disc list-inside space-y-1">
                {citationStyle.commonUses.map((use, idx) => (
                  <li key={idx}>{use}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4">{citationStyle.name} Citation Examples</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Book Citation:</h3>
                <code className="block p-3 bg-[hsl(var(--muted))] rounded text-sm">{citationStyle.examples.book}</code>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Journal Article Citation:</h3>
                <code className="block p-3 bg-[hsl(var(--muted))] rounded text-sm">{citationStyle.examples.journal}</code>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Website Citation:</h3>
                <code className="block p-3 bg-[hsl(var(--muted))] rounded text-sm">{citationStyle.examples.website}</code>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">In-Text Citation:</h3>
                <code className="block p-3 bg-[hsl(var(--muted))] rounded text-sm">{citationStyle.examples.inText}</code>
              </div>
            </div>
          </div>

          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4">Best Practices for {purposeName}</h2>
            <ul className="list-disc list-inside space-y-2 text-lg">
              <li>Always verify your citations match the {citationStyle.name} style requirements</li>
              <li>Use consistent formatting throughout your {purposeName.toLowerCase()}</li>
              <li>Include all required elements for each source type</li>
              <li>Double-check in-text citations match your reference list</li>
              <li>Use citation management tools to ensure accuracy</li>
            </ul>
          </div>

          {relatedCombinations.length > 0 && (
            <div className="mt-12">
              <RelatedContent
                title={`Other Citation Styles for ${purposeName}`}
                items={relatedCombinations}
              />
            </div>
          )}

          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] p-6 rounded-lg mt-8">
            <h2 className="text-2xl font-bold mb-4">Need Help with Citations?</h2>
            <p className="mb-6 text-lg leading-relaxed">
              Use Akowe to automatically format citations in {citationStyle.name} style. Search real academic sources, add citations with one click, and ensure consistency throughout your {purposeName.toLowerCase()}.
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
