'use client';

import { useEffect } from 'react';
import { trackPseo } from '@/lib/gtag';

interface PseoPageTrackerProps {
  pageType: string;
  slug: string;
}

export default function PseoPageTracker({ pageType, slug }: PseoPageTrackerProps) {
  useEffect(() => {
    trackPseo.pageView(pageType, slug);
  }, [pageType, slug]);

  return null;
}
