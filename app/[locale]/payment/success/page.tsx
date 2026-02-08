'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle } from 'lucide-react';
import { trackFunnel } from '@/lib/gtag';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Call API to check and update user plan
    const checkAndUpdatePlan = async () => {
      try {
        const response = await fetch('/api/payment/confirm-upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: searchParams.get('session_id') }),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Plan updated successfully', data);
          
          // Track purchase if tracking metadata is provided
          // Note: ServerTrackingHandler will also check for purchase tracking,
          // but we track here immediately for better accuracy
          if (data.tracking?.trackEvent) {
            const { eventName, params } = data.tracking.trackEvent;
            if (eventName === 'purchase') {
              trackFunnel.purchase(
                params.user_id,
                params.billing_cycle,
                params.plan_type,
                params.value,
                params.currency
              );
            }
          }
          
          // Update the session to reflect the new plan
          if (updateSession) {
            await updateSession();
          }
        }
      } catch (error) {
        console.error('Error confirming upgrade:', error);
      }
    };

    // Give Stripe time to send the webhook, then check
    const timer = setTimeout(() => {
      checkAndUpdatePlan();
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchParams, updateSession]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Processing your payment...
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your subscription.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Welcome to Pro! You now have access to all premium features.
            </p>
            <button
              onClick={() => router.push('/settings?upgraded=true')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Go to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Loading...
        </h2>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
