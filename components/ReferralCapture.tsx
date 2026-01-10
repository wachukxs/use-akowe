'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const REFERRAL_STORAGE_KEY = 'akowe_referral_code';

/**
 * Captures referral codes from URL and persists them in localStorage.
 * This ensures referral tracking works regardless of which page a user lands on.
 */
export default function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      // Store the referral code in localStorage
      localStorage.setItem(REFERRAL_STORAGE_KEY, ref);
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
