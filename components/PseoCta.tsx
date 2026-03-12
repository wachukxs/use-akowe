'use client';

import { Link } from '@/i18n/navigation';
import { trackPseo } from '@/lib/gtag';

interface PseoCtaProps {
  href: string;
  label: string;
  pageType: string;
  slug: string;
  position: 'header' | 'inline' | 'bottom';
  className?: string;
}

export default function PseoCta({ href, label, pageType, slug, position, className }: PseoCtaProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackPseo.ctaClicked(pageType, slug, position)}
    >
      {label}
    </Link>
  );
}
