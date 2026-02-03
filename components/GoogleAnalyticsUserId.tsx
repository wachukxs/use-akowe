'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { setUserId, clearUserId } from '@/lib/gtag';

/**
 * Component that automatically sets GA4 user_id when user is authenticated
 * This ensures user_id is set for both credentials and OAuth login flows
 * Runs globally via Providers component
 */
export default function GoogleAnalyticsUserId() {
  const { data: session, status } = useSession();
  const userIdSetRef = useRef<string | null>(null);

  useEffect(() => {
    // Wait for session to be determined (not loading)
    if (status === 'loading') {
      return;
    }

    const userId = (session?.user as any)?.id;

    // Set user_id if authenticated and not already set for this user
    if (status === 'authenticated' && userId && userIdSetRef.current !== userId) {
      // Wait for gtag to be available (GA script loads asynchronously)
      const checkAndSetUserId = () => {
        if (typeof window !== 'undefined' && window.gtag) {
          setUserId(userId);
          userIdSetRef.current = userId;
        } else {
          // Retry after a short delay if gtag not yet loaded
          setTimeout(checkAndSetUserId, 100);
        }
      };

      // Initial check
      checkAndSetUserId();
    } else if (status === 'unauthenticated' && userIdSetRef.current) {
      // Clear user_id on logout
      clearUserId();
      userIdSetRef.current = null;
    }
  }, [session, status]);

  // This component doesn't render anything
  return null;
}
