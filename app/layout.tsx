import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "@/components/Providers";
import ReferralCapture from "@/components/ReferralCapture";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Akowe - Write research that holds up.",
    template: "%s | Akowe",
  },
  description: "AI-powered academic writing and research tool for essays, thesis projects, and longform research documents. Real sources, proper citations, and structured writing—all in one workspace.",
  keywords: [
    // Primary: High-volume, brand awareness keywords
    "academic writing tool",
    "academic writing software",
    "academic writing platform",
    "citation manager",
    "reference manager",
    "citation generator",
    "plagiarism checker",
    "plagiarism checker for students",
    "thesis writing software",
    "research paper writing tool",
    
    // Medium: Feature-specific, medium competition
    "AI writing assistant for students",
    "AI writing tool for research papers",
    "thesis writing app",
    "dissertation writing software",
    "APA citation generator",
    "MLA citation generator",
    "Chicago citation generator",
    "IEEE citation format",
    "academic plagiarism checker",
    "originality check tool",
    "Turnitin alternative",
    "Zotero alternative",
    "Mendeley alternative",
    
    // Long-tail: High-intent, conversion-focused
    "AI tool for writing research papers with citations",
    "write thesis with AI assistance",
    "best software for academic writing",
    "how to cite sources in research paper",
    "best citation manager for thesis writers",
    "auto-format citations",
    "free plagiarism checker for research papers",
    "check thesis for plagiarism",
    "how to avoid plagiarism in thesis writing",
    "help writing a literature review",
    "organize research paper",
    "thesis structure guide",
    "how to write a literature review",
    "best tools for organizing research notes",
    "how to format a thesis in APA",
    
    // Citation style guides (programmatic targets)
    "APA citation guide",
    "MLA format guide",
    "Chicago style guide",
    "how to cite a book in APA",
    "how to cite a website in MLA",
    "APA 7th edition citation",
    "IEEE citation format",
    
    // Academic comparisons (thought leadership)
    "best academic writing tools",
    "top AI tools for researchers",
    "Jenni vs ChatGPT for academic writing",
    "academic writing AI comparison",
    
    // Core differentiators
    "real sources academic writing",
    "proper citations academic papers",
    "all-in-one academic writing workspace",
    "academic integrity tool",
    "research assistant software",
  ],
  authors: [{ name: "Akowe" }],
  creator: "Akowe",
  publisher: "Akowe",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Akowe',
    title: 'Akowe - Write research that holds up.',
    description: 'AI-powered academic writing and research tool for essays, thesis projects, and longform research documents. Real sources, proper citations, and structured writing—all in one workspace.',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Akowe - Academic Writing Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Akowe - Write research that holds up.',
    description: 'AI-powered academic writing and research tool for essays, thesis projects, and longform research documents.',
    images: [`${baseUrl}/og-image.png`],
    creator: '@akowe',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Structured Data (JSON-LD) for Organization and SoftwareApplication
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'Akowe',
        url: baseUrl,
        logo: `${baseUrl}/icon.png`,
        description: 'AI-powered academic writing and research tool for essays, thesis projects, and longform research documents.',
        sameAs: [
          // Add social media profiles when available
          // 'https://twitter.com/akowe',
          // 'https://linkedin.com/company/akowe',
        ],
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${baseUrl}/#software`,
        name: 'Akowe',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        description: 'AI-powered academic writing and research tool with real sources, proper citations, and structured writing—all in one workspace.',
        featureList: [
          'AI-powered writing assistance',
          'Citation management',
          'Plagiarism detection',
          'Academic source search',
          'Multiple citation styles (APA, MLA, Chicago, IEEE)',
          'PDF upload and analysis',
          'Export to PDF and DOCX',
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '300',
        },
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" integrity="sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntILdUW9XmUC6+HX0sLNAK3q71HotJqlAn" crossOrigin="anonymous" />
        {/* Structured Data (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/* Google Analytics - Conditionally loaded (excludes admin pages) */}
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
      </head>
      <body className="antialiased">
        <Script 
          src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js" 
          integrity="sha384-cpW21h6RZv/phavutF+AuVYrr+dA8xD9zs6FwLpaCct6O9ctzYFfFr4dgmgccOTx" 
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        <Providers>
          <Suspense fallback={null}>
            <ReferralCapture />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
