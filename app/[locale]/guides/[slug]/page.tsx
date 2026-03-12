import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, BookOpen, CheckCircle } from 'lucide-react';
import { getAllGuideSlugs, getGuideBySlug } from '@/lib/seo/guides';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { getBreadcrumbStructuredData } from '@/lib/seo/breadcrumb-structured-data';
import { RelatedContent } from '@/components/seo/RelatedContent';
import InlinePlagiarismTool from '@/components/InlinePlagiarismTool';
import { generateSEOMetadata } from '@/lib/seo/metadata';
import { generateWebPageSchema, generateHowToSchema } from '@/lib/seo/schema';
import PseoCta from '@/components/PseoCta';
import PseoPageTracker from '@/components/PseoPageTracker';

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return {
      title: 'Guide Not Found',
    };
  }

  return generateSEOMetadata({
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    path: `/guides/${slug}`,
    type: 'article',
    publishedTime: new Date().toISOString(),
    modifiedTime: new Date().toISOString(),
  });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  // Get related guides (same category or related topics)
  const allGuides = getAllGuideSlugs()
    .map((s) => getGuideBySlug(s))
    .filter((g) => g && g.slug !== slug)
    .slice(0, 6);

  const relatedGuides = allGuides.map((g) => ({
    title: g!.title,
    href: `/guides/${g!.slug}`,
    description: g!.description,
  }));

  const breadcrumbData = getBreadcrumbStructuredData(
    [
      { label: 'Guides', href: '/guides' },
      { label: guide.title, href: `/guides/${slug}` },
    ],
    baseUrl
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <PseoPageTracker pageType="guide" slug={slug} />
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
            <PseoCta
              href="/auth/signin"
              label="Get Started"
              pageType="guide"
              slug={slug}
              position="header"
              className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 py-2.5 font-semibold uppercase tracking-[0.18em] text-sm"
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <Breadcrumbs
          items={[
            { label: 'Guides', href: '/guides' },
            { label: guide.title, href: `/guides/${slug}` },
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
              url: `${baseUrl}/guides/${slug}`,
              title: guide.title,
              description: guide.description,
              datePublished: new Date().toISOString(),
              dateModified: new Date().toISOString(),
            })),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: guide.title,
              description: guide.description,
              author: {
                '@type': 'Organization',
                name: 'Akowe',
              },
              publisher: {
                '@type': 'Organization',
                name: 'Akowe',
                logo: {
                  '@type': 'ImageObject',
                  url: `${baseUrl}/icon.png`,
                },
              },
              datePublished: new Date().toISOString(),
              dateModified: new Date().toISOString(),
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `${baseUrl}/guides/${slug}`,
              },
            }),
          }}
        />
        {guide.content.sections.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateHowToSchema({
                name: guide.title,
                description: guide.description,
                steps: guide.content.sections.map((section) => ({
                  name: section.heading,
                  text: section.content,
                })),
              })),
            }}
          />
        )}
        <article className="prose prose-lg max-w-none">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-4">
              <BookOpen size={16} />
              <span>Academic Writing Guide</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">{guide.title}</h1>
            <p className="text-xl text-[hsl(var(--muted-foreground))]">{guide.description}</p>
          </div>

          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg mb-8">
            <p className="text-lg leading-relaxed">{guide.content.introduction}</p>
          </div>

          <div className="space-y-8">
            {guide.content.sections.map((section, index) => (
              <section key={index} className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <CheckCircle size={24} className="text-[hsl(var(--primary))]" />
                  {section.heading}
                </h2>
                <p className="text-base leading-relaxed">{section.content}</p>
              </section>
            ))}
          </div>

          {/* Inline Plagiarism Tool - mid-article */}
          <InlinePlagiarismTool />

          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] p-6 rounded-lg mt-8">
            <h2 className="text-2xl font-bold mb-4">Conclusion</h2>
            <p className="text-lg leading-relaxed">{guide.content.conclusion}</p>
          </div>

          <div className="mt-12 border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Ready to put this into practice?</h2>
            <p className="mb-6">
              Apply everything in this guide inside Akowe. AI-assisted writing, automatic citations, plagiarism checks — all in one place, built for exactly this kind of work.
            </p>
            <PseoCta
              href="/auth/signin"
              label="Start writing — it's free"
              pageType="guide"
              slug={slug}
              position="bottom"
              className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-6 py-3 font-semibold uppercase tracking-[0.18em]"
            />
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

          <RelatedContent
            title="Related Guides"
            items={relatedGuides}
            type="guides"
          />

          <div className="mt-8 text-sm text-[hsl(var(--muted-foreground))]">
            <p>
              <Link href="/guides" className="underline">View all guides</Link> |{' '}
              <Link href="/citation-styles" className="underline">Citation style guides</Link> |{' '}
              <Link href="/templates" className="underline">Writing templates</Link>
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}

