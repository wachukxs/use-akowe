'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

const REFERRAL_STORAGE_KEY = 'akowe_referral_code';

/**
 * Captures referral codes from URL and persists them in localStorage.
 * This ensures referral tracking works regardless of which page a user lands on.
 * Also tracks referral link clicks for affiliate stats.
 */
export default function ReferralCapture() {
  const searchParams = useSearchParams();
  const hasTrackedClick = useRef<Set<string>>(new Set());

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      // Store the referral code in localStorage
      localStorage.setItem(REFERRAL_STORAGE_KEY, ref);

      // Track the click (only once per page load to avoid duplicate tracking)
      if (!hasTrackedClick.current.has(ref)) {
        hasTrackedClick.current.add(ref);
        
        // Fire-and-forget click tracking (don't block the user)
        fetch('/api/referral/track-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referralCode: ref }),
        }).catch(err => {
          // Silently fail - tracking shouldn't break user experience
          console.error('Failed to track referral click:', err);
        });
      }
    }
  }, [searchParams]);

  // This component doesn't render anything
  return null;
}

/**
 * Utility function to get the stored referral code
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFERRAL_STORAGE_KEY);
}

/**
 * Utility function to clear the stored referral code (call after successful signup)
 */
export function clearStoredReferralCode(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
}
