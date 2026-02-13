import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import { getAllTemplateSlugs, getTemplateBySlug } from '@/lib/seo/templates';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { getBreadcrumbStructuredData } from '@/lib/seo/breadcrumb-structured-data';
import { RelatedContent } from '@/components/seo/RelatedContent';
import { generateSEOMetadata } from '@/lib/seo/metadata';
import { generateWebPageSchema } from '@/lib/seo/schema';

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const template = getTemplateBySlug(type);

  if (!template) {
    return {
      title: 'Template Not Found',
    };
  }

  return generateSEOMetadata({
    title: template.title,
    description: template.description,
    keywords: template.keywords,
    path: `/templates/${type}`,
  });
}

export default async function TemplatePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const template = getTemplateBySlug(type);

  if (!template) {
    notFound();
  }

  // Get related templates
  const allTemplates = getAllTemplateSlugs()
    .map((t) => getTemplateBySlug(t))
    .filter((t) => t && t.slug !== type)
    .slice(0, 6);

  const relatedTemplates = allTemplates.map((t) => ({
    title: t!.title,
    href: `/templates/${t!.slug}`,
    description: t!.description,
  }));

  const breadcrumbData = getBreadcrumbStructuredData(
    [
      { label: 'Templates', href: '/templates' },
      { label: template.title, href: `/templates/${type}` },
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
            { label: 'Templates', href: '/templates' },
            { label: template.title, href: `/templates/${type}` },
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
              url: `${baseUrl}/templates/${type}`,
              title: template.title,
              description: template.description,
            })),
          }}
        />
        <article className="prose prose-lg max-w-none">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-4">
              <FileText size={16} />
              <span>Writing Template</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">{template.title}</h1>
            <p className="text-xl text-[hsl(var(--muted-foreground))]">{template.description}</p>
          </div>

          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4">Template Type</h2>
            <p className="text-lg mb-4">{template.type}</p>
            <h2 className="text-2xl font-bold mb-4">Best For</h2>
            <p className="text-lg">{template.useCase}</p>
          </div>

          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4">Structure</h2>
            <ol className="list-decimal list-inside space-y-3">
              {template.structure.map((section, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-[hsl(var(--primary))] mt-1 flex-shrink-0" />
                  <span className="text-lg">{section}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Use This Template in Akowe</h2>
            <p className="mb-6 text-lg leading-relaxed">
              Create a new project in Akowe and use this structure to organize your {template.type.toLowerCase()}. 
              Akowe&apos;s section-based editor makes it easy to follow this template, and you can add citations, 
              check for plagiarism, and export your finished work—all in one place.
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] px-6 py-3 font-semibold uppercase tracking-[0.18em]"
            >
              Start Your {template.type}
            </Link>
          </div>

          <RelatedContent
            title="Related Templates"
            items={relatedTemplates}
            type="templates"
          />

          <div className="mt-8 text-sm text-[hsl(var(--muted-foreground))]">
            <p>
              <Link href="/templates" className="underline">View all templates</Link> |{' '}
              <Link href="/guides" className="underline">Writing guides</Link> |{' '}
              <Link href="/citation-styles" className="underline">Citation styles</Link>
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}

