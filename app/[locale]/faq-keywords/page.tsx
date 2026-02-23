import { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo/metadata';
import Link from 'next/link';
import { HelpCircle, ArrowRight } from 'lucide-react';
import { getAllKeywordPages } from '@/lib/seo/keywords';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { getBreadcrumbStructuredData } from '@/lib/seo/breadcrumb-structured-data';

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = generateSEOMetadata({
    title: 'Academic Writing FAQ - Akowe',
    description: 'Frequently asked questions about academic writing, citations, plagiarism, and research methods. Clear answers for students and researchers.',
    keywords: ['academic writing faq', 'academic writing questions', 'citation questions', 'plagiarism faq', 'research writing help'],
    path: '/faq-keywords',
  });
  if (locale !== 'en') metadata.robots = { index: false, follow: true };
  return metadata;
}

export default async function FAQKeywordsIndexPage() {
  const pages = await getAllKeywordPages('faq');

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
          items={[{ label: 'FAQ', href: '/faq-keywords' }] as Array<{ label: string; href: string }>}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getBreadcrumbStructuredData(
              [{ label: 'FAQ', href: '/faq-keywords' }],
              baseUrl
            )),
          }}
        />
        <div className="mb-12">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-4">
            <HelpCircle size={16} />
            <span>Frequently Asked Questions</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Academic Writing FAQ</h1>
          <p className="text-xl text-[hsl(var(--muted-foreground))]">
            Clear answers to common questions about academic writing, citations, plagiarism, and research methods.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <Link
              key={page.slug}
              href={`/faq-keywords/${page.slug}`}
              className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-bold mb-2">{page.title}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 line-clamp-2">
                {page.description}
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
            <Link href="/topics" className="underline">Academic topics</Link> |{' '}
            <Link href="/" className="underline">Home</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
