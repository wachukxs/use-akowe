'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { trackFunnel } from '@/lib/gtag';

/**
 * Component that handles server-side tracking events
 * Checks for tracking metadata in API responses and tracks events client-side
 * Also handles purchase tracking from webhook metadata stored in user document
 */
export default function ServerTrackingHandler() {
  const { data: session } = useSession();
  const hasCheckedPurchase = useRef(false);

  useEffect(() => {
    // Check for purchase tracking metadata from webhook
    if (session?.user && !hasCheckedPurchase.current) {
      const checkPurchaseTracking = async () => {
        try {
          const response = await fetch('/api/user/purchase-tracking');
          if (response.ok) {
            const data = await response.json();
            if (data.tracking) {
              const { eventName, params } = data.tracking;
              if (eventName === 'purchase') {
                trackFunnel.purchase(
                  params.user_id,
                  params.billing_cycle,
                  params.plan_type,
                  params.value,
                  params.currency
                );
                // Clear the tracking metadata after tracking
                await fetch('/api/user/purchase-tracking', { method: 'DELETE' });
              }
            }
          }
        } catch (error) {
          // Silently fail - tracking shouldn't break user experience
          console.error('Failed to check purchase tracking:', error);
        }
        hasCheckedPurchase.current = true;
      };

      checkPurchaseTracking();
    }
  }, [session]);

  // This component doesn't render anything
  return null;
}
