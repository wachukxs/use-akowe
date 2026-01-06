import { Metadata } from 'next';

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

export const metadata: Metadata = {
  title: 'About Akowe - Academic Writing Platform',
  description: 'Learn about Akowe, the AI-powered academic writing and research tool designed for students and scholars. Real sources, proper citations, and structured writing—all in one workspace.',
  openGraph: {
    title: 'About Akowe - Academic Writing Platform',
    description: 'Learn about Akowe, the AI-powered academic writing and research tool designed for students and scholars.',
    url: `${baseUrl}/about`,
  },
  twitter: {
    title: 'About Akowe - Academic Writing Platform',
    description: 'Learn about Akowe, the AI-powered academic writing and research tool designed for students and scholars.',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

