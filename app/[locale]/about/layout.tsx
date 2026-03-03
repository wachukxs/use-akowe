import { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = generateSEOMetadata({
    title: 'About Akowe - Academic Writing Platform',
    description: 'Learn about Akowe, the AI-powered academic writing and research tool designed for students and scholars. Real sources, proper citations, and structured writing—all in one workspace.',
    keywords: ['about akowe', 'akowe platform', 'academic writing tool', 'AI research tool'],
    path: '/about',
  });
  if (locale !== 'en') metadata.robots = { index: false, follow: true };
  return metadata;
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

