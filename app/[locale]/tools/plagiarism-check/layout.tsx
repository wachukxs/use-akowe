import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'en') {
    return { robots: { index: false, follow: false } };
  }
  const metadata = generateSEOMetadata({
    title: 'Free Academic Source Checker — Check Writing Against 250M+ Papers',
    description:
      'Check your writing against 250 million published academic papers from Crossref, arXiv, and Semantic Scholar. Surface uncited claims, verify DOIs, and catch originality issues before submission. Free, no account required.',
    keywords: [
      'academic source checker',
      'plagiarism checker',
      'citation checker free',
      'DOI verification',
      'Crossref checker',
      'academic writing tool',
    ],
    path: '/tools/plagiarism-check',
  });
  if (metadata.alternates) {
    metadata.alternates = { canonical: metadata.alternates.canonical };
  }
  return metadata;
}

export default function PlagiarismCheckLayout({ children }: { children: React.ReactNode }) {
  return children;
}
