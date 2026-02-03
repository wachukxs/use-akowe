'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { trackFunnel } from '@/lib/gtag';

/**
 * Component that tracks Google OAuth signup completion
 * Checks sessionStorage for signup metadata after Google redirect
 * Similar pattern to GoogleAnalyticsUserId but for signup tracking
 */
export default function GoogleSignupTracking() {
  const { data: session, status } = useSession();
  const hasTrackedSignup = useRef(false);

  useEffect(() => {
    // Wait for session to be determined
    if (status === 'loading') {
      return;
    }

    // Only track if user is authenticated and we haven't tracked yet
    if (status === 'authenticated' && session?.user && !hasTrackedSignup.current) {
      const userId = (session.user as any)?.id;
      const signupMethod = sessionStorage.getItem('signup_method');
      const signupSource = sessionStorage.getItem('signup_source') || 'direct';

      // If this was a Google signup (indicated by sessionStorage)
      if (signupMethod === 'google' && userId) {
        trackFunnel.signupComplete(userId, 'google', signupSource);
        hasTrackedSignup.current = true;
        
        // Clean up sessionStorage
        sessionStorage.removeItem('signup_method');
        sessionStorage.removeItem('signup_source');
      }
    }
  }, [session, status]);

  // This component doesn't render anything
  return null;
}
