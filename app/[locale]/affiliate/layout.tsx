import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Affiliate Program — Earn 30% Recurring Commissions | Akowe',
  description: 'Join the Akowe affiliate program. Earn 30% recurring commission for 12 months on every paying subscriber you refer. Designed for bloggers, YouTubers, and educators who reach students and researchers.',
  keywords: [
    'akowe affiliate program',
    'academic tool affiliate',
    'education affiliate program',
    'ai writing tool affiliate',
    'recurring commission affiliate',
    'student tool affiliate program',
    'research tool affiliate',
    'citation tool affiliate',
  ],
  openGraph: {
    title: 'Akowe Affiliate Program — 30% Recurring Commission',
    description: 'Earn 30% recurring commission for 12 months on every paying subscriber you refer. Built for bloggers, educators, and YouTubers who reach academic audiences.',
    type: 'website',
  },
  alternates: {
    canonical: '/affiliate',
  },
};

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
