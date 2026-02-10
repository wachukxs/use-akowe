import { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, ArrowRight } from 'lucide-react';
import { getAllFAQSlugs, getFAQBySlug } from '@/lib/seo/faqs';
import { Breadcrumbs, BreadcrumbStructuredData } from '@/components/seo/Breadcrumbs';

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions - Akowe',
  description: 'Find answers to common questions about Akowe, the all-in-one academic writing platform. Learn about features, pricing, citations, and more.',
  keywords: [
    'akowe FAQ',
    'akowe questions',
    'akowe help',
    'akowe support',
    'akowe answers',
  ],
  openGraph: {
    title: 'Frequently Asked Questions - Akowe',
    description: 'Find answers to common questions about Akowe, the all-in-one academic writing platform.',
    url: `${baseUrl}/faq`,
  },
};

export default function FAQIndexPage() {
  const faqSlugs = getAllFAQSlugs();
  const faqs = faqSlugs
    .map((slug) => getFAQBySlug(slug))
    .filter((faq): faq is NonNullable<typeof faq> => faq !== undefined);

  const breadcrumbData = BreadcrumbStructuredData({
    items: [{ label: 'FAQ', href: '/faq' }],
  });

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
          items={[{ label: 'FAQ', href: '/faq' }] as Array<{ label: string; href: string }>}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
        />
        <div className="mb-12">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-4">
            <HelpCircle size={16} />
            <span>Frequently Asked Questions</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-[hsl(var(--muted-foreground))]">
            Find answers to common questions about Akowe, the all-in-one academic writing platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {faqs.map((faq) => (
            <Link
              key={faq.slug}
              href={`/faq/${faq.slug}`}
              className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-bold mb-2">{faq.question}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 line-clamp-2">
                {faq.answer.substring(0, 150)}...
              </p>
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--primary))]">
                <span>Read answer</span>
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
