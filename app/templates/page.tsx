import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';
import { getAllTemplateSlugs, getTemplateBySlug } from '@/lib/seo/templates';
import { Breadcrumbs, BreadcrumbStructuredData } from '@/components/seo/Breadcrumbs';

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

export const metadata: Metadata = {
  title: 'Academic Writing Templates - Akowe',
  description: 'Free academic writing templates for research papers, theses, essays, and more. Download and customize templates for your academic writing needs.',
  keywords: [
    'academic writing templates',
    'research paper templates',
    'thesis templates',
    'essay templates',
    'academic paper templates',
  ],
  openGraph: {
    title: 'Academic Writing Templates - Akowe',
    description: 'Free academic writing templates for research papers, theses, essays, and more.',
    url: `${baseUrl}/templates`,
  },
};

export default function TemplatesIndexPage() {
  const templateSlugs = getAllTemplateSlugs();
  const templates = templateSlugs
    .map((slug) => getTemplateBySlug(slug))
    .filter((template): template is NonNullable<typeof template> => template !== undefined);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="sticky top-0 z-50 border-b-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]">
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
          items={[{ label: 'Templates', href: '/templates' }] as Array<{ label: string; href: string }>}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(BreadcrumbStructuredData({
              items: [{ label: 'Templates', href: '/templates' }],
            })),
          }}
        />
        <div className="mb-12">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-4">
            <FileText size={16} />
            <span>Writing Templates</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Academic Writing Templates</h1>
          <p className="text-xl text-[hsl(var(--muted-foreground))]">
            Free templates to help you structure and format your academic writing projects.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Link
              key={template.slug}
              href={`/templates/${template.slug}`}
              className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-bold mb-2">{template.title}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 line-clamp-2">
                {template.description}
              </p>
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--primary))]">
                <span>View template</span>
                <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-sm text-[hsl(var(--muted-foreground))]">
          <p>
            <Link href="/guides" className="underline">Writing guides</Link> |{' '}
            <Link href="/citation-styles" className="underline">Citation styles</Link> |{' '}
            <Link href="/" className="underline">Home</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

