import { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { getFAQBySlug } from '@/lib/seo/faqs';
import { Breadcrumbs, BreadcrumbStructuredData } from '@/components/seo/Breadcrumbs';
import InlineImportTool from '@/components/InlineImportTool';
import { generateSEOMetadata } from '@/lib/seo/metadata';
import { generateWebPageSchema } from '@/lib/seo/schema';

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const faq = getFAQBySlug(slug);
  
  if (!faq) {
    return {
      title: 'FAQ Not Found - Akowe',
    };
  }

  return generateSEOMetadata({
    title: `${faq.question} - Akowe FAQ`,
    description: faq.answer.substring(0, 160),
    keywords: faq.keywords,
    path: `/faq/${slug}`,
  });
}

export default async function FAQPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const faq = getFAQBySlug(slug);

  if (!faq) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-2xl font-bold mb-4">FAQ Not Found</h1>
          <Link href="/faq" className="text-[hsl(var(--primary))] underline">
            Back to FAQs
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
            { label: 'FAQ', href: '/faq' },
            { label: faq.question, href: `/faq/${slug}` },
          ] as Array<{ label: string; href: string }>}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: {
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(BreadcrumbStructuredData({
              items: [
                { label: 'FAQ', href: '/faq' },
                { label: faq.question, href: `/faq/${slug}` },
              ],
            })),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateWebPageSchema({
              url: `${baseUrl}/faq/${slug}`,
              title: `${faq.question} - Akowe FAQ`,
              description: faq.answer.substring(0, 160),
            })),
          }}
        />

        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-4">
            <HelpCircle size={16} />
            <span>Frequently Asked Questions</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">{faq.question}</h1>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 rounded-lg">
            <p className="text-lg leading-relaxed whitespace-pre-line">{faq.answer}</p>
          </div>
        </div>

        {faq.relatedQuestions && faq.relatedQuestions.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Related Questions</h2>
            <ul className="space-y-2">
              {faq.relatedQuestions.map((relatedSlug) => {
                const relatedFAQ = getFAQBySlug(relatedSlug);
                if (!relatedFAQ) return null;
                return (
                  <li key={relatedSlug}>
                    <Link
                      href={`/faq/${relatedSlug}`}
                      className="text-[hsl(var(--primary))] hover:underline"
                    >
                      {relatedFAQ.question}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Inline Import Tool */}
        <InlineImportTool />

        <div className="mt-12 border-t border-[hsl(var(--border-strong))] pt-8">
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
            Still have questions? <Link href="/auth/signin" className="text-[hsl(var(--primary))] underline">Get started with Akowe</Link> or check out our other resources.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/guides" className="text-[hsl(var(--primary))] underline">Writing Guides</Link>
            <Link href="/templates" className="text-[hsl(var(--primary))] underline">Templates</Link>
            <Link href="/citation-styles" className="text-[hsl(var(--primary))] underline">Citation Styles</Link>
            <Link href="/" className="text-[hsl(var(--primary))] underline">Home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

