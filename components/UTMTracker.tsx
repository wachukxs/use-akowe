'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/gtag';

/**
 * Inner component that uses useSearchParams. Wrapped in Suspense by UTMTracker
 * so static generation does not bail out (see Next.js missing-suspense-with-csr-bailout).
 */
function UTMTrackerInner() {
  const searchParams = useSearchParams();
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (hasTracked.current) return;

    // Extract UTM parameters from URL
    let utmSource = searchParams.get('utm_source');
    let utmMedium = searchParams.get('utm_medium');
    let utmCampaign = searchParams.get('utm_campaign');
    const utmContent = searchParams.get('utm_content');
    const utmTerm = searchParams.get('utm_term');
    const ref = searchParams.get('ref');

    // If there's a ref but no UTMs, use default UTMs (matching middleware logic)
    if (ref && !utmSource && !utmMedium && !utmCampaign) {
      utmSource = 'referral';
      utmMedium = 'referral';
      utmCampaign = 'referral';
    }

    // Track UTM parameters if present
    if (utmSource || utmMedium || utmCampaign || ref) {
      trackEvent('utm_parameters', {
        utm_source: utmSource || 'direct',
        utm_medium: utmMedium || (ref ? 'referral' : 'direct'),
        utm_campaign: utmCampaign || (ref ? 'referral' : 'none'),
        utm_content: utmContent || null,
        utm_term: utmTerm || null,
        ref: ref || null,
        page_path: typeof window !== 'undefined' ? window.location.pathname : '',
        page_url: typeof window !== 'undefined' ? window.location.href : '',
      });

      hasTracked.current = true;
    }
  }, [searchParams]);

  return null;
}

/**
 * Component that tracks UTM parameters in GA4.
 * Captures UTM params from URL and sends them as events for better attribution.
 * Also handles default UTMs for referral links without UTMs.
 */
export default function UTMTracker() {
  return (
    <Suspense fallback={null}>
      <UTMTrackerInner />
    </Suspense>
  );
}
