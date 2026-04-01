'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Sidebar, { MobileMenuButton } from '@/components/Sidebar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { UsageLimits, PlanType } from '@/types';
import { Check, Crown, Users, X, Info, Copy, Gift, AlertTriangle } from 'lucide-react';
import { trackFunnel } from '@/lib/gtag';
import { buildReferralLink } from '@/lib/referral-links';
import Active37DiscountPopup from '@/components/Active37DiscountPopup';
import { getProPlanDiscount, formatDiscountPercentage } from '@/lib/annual-discount';

interface UsageData {
  aiWordsGenerated: number;
  plagiarismChecks: number;
  paraphraseUses: number;
  limits: UsageLimits;
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnnual, setIsAnnual] = useState(true); // Default to annual billing
  const [isUpgrading, setIsUpgrading] = useState(false); // Loading state for upgrade
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null); // Store subscription status
  const [copiedReferral, setCopiedReferral] = useState(false); // Track copy state for referral
  const [checkoutFeedbackDismissed, setCheckoutFeedbackDismissed] = useState(false);
  const [checkoutFeedbackSubmitted, setCheckoutFeedbackSubmitted] = useState(false);
  const [checkoutFeedbackMessage, setCheckoutFeedbackMessage] = useState('');
  const [checkoutFeedbackSubmitting, setCheckoutFeedbackSubmitting] = useState(false);
  const [checkoutFeedbackError, setCheckoutFeedbackError] = useState('');
  const [hasCheckoutCancelledParam, setHasCheckoutCancelledParam] = useState(false);
  const [showActive37Popup, setShowActive37Popup] = useState(false);
  const [active37Eligibility, setActive37Eligibility] = useState<{ eligible: boolean; activeDays?: number } | null>(null);
  const CHECKOUT_REDIRECT_FLAG = 'akowe_checkout_redirecting';
  const CHECKOUT_REDIRECT_FLAG_FALLBACK = 'akowe_checkout_redirecting_ls';

  const showCheckoutFeedback =
    hasCheckoutCancelledParam &&
    !checkoutFeedbackDismissed &&
    !checkoutFeedbackSubmitted;

  const dismissCheckoutFeedback = () => {
    setCheckoutFeedbackDismissed(true);
    window.history.replaceState({}, '', '/settings');
  };

  const handleCheckoutFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || !checkoutFeedbackMessage.trim()) return;
    setCheckoutFeedbackSubmitting(true);
    setCheckoutFeedbackError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: session.user.name || session.user.email || 'Unknown',
          email: session.user.email || '',
          message: checkoutFeedbackMessage.trim(),
          context: 'checkout_cancelled',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to send');
      }
      setCheckoutFeedbackSubmitted(true);
      window.history.replaceState({}, '', '/settings');
    } catch (err) {
      setCheckoutFeedbackError(err instanceof Error ? err.message : t('alerts.failedToSend'));
    } finally {
      setCheckoutFeedbackSubmitting(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUsage();
      checkActive37Eligibility();
    }
  }, [session]);

  // Check if user is eligible for ACTIVE37 discount
  const checkActive37Eligibility = async () => {
    if (!session?.user?.email) return;

    // IMPORTANT: Never show popup to Pro users (client-side check)
    const userPlan = (session.user as any)?.plan;
    if (userPlan && userPlan !== 'free') {
      return;
    }

    // Check if user has already dismissed permanently
    const dismissedPermanently = localStorage.getItem('akowe_active37_dismissed_permanent');
    if (dismissedPermanently === 'true') return;

    // Check if shown today
    const lastShownDate = localStorage.getItem('akowe_active37_last_shown');
    const today = new Date().toDateString();
    if (lastShownDate === today) return;

    try {
      const response = await fetch('/api/user/active-discount-eligibility');
      if (response.ok) {
        const data = await response.json();
        // Double-check: Only show if eligible AND still on free plan
        if (data.eligible && userPlan === 'free') {
          setActive37Eligibility(data);
          setShowActive37Popup(true);
          localStorage.setItem('akowe_active37_last_shown', today);
        }
      }
    } catch (error) {
      console.error('Error checking ACTIVE37 eligibility:', error);
    }
  };

  // Read checkout_cancelled from URL on client (avoids useSearchParams Suspense requirement)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout_cancelled') === '1') {
      setHasCheckoutCancelledParam(true);
    }
  }, []);

  // Refresh session when coming back from payment success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('upgraded') === 'true') {
      // Refresh session to get updated plan
      if (update) {
        update();
      }
      // Remove the query param from URL
      window.history.replaceState({}, '', '/settings');
    }
  }, [update]);

  // If the page is restored from browser back/forward cache after external checkout,
  // ensure upgrade buttons are clickable again.
  useEffect(() => {
    const resetUpgradeState = () => setIsUpgrading(false);
    const clearCheckoutRedirect = () => {
      sessionStorage.removeItem(CHECKOUT_REDIRECT_FLAG);
      localStorage.removeItem(CHECKOUT_REDIRECT_FLAG_FALLBACK);
    };
    const hasCheckoutRedirectMark = () =>
      sessionStorage.getItem(CHECKOUT_REDIRECT_FLAG) === '1' ||
      localStorage.getItem(CHECKOUT_REDIRECT_FLAG_FALLBACK) === '1';

    const handlePageShow = (event: PageTransitionEvent) => {
      const fromCheckoutRedirect = hasCheckoutRedirectMark();
      if (fromCheckoutRedirect) {
        clearCheckoutRedirect();
      }

      if (event.persisted) {
        resetUpgradeState();
        // bfcache can restore stale React state; force clean re-render after checkout return.
        if (fromCheckoutRedirect) {
          window.location.reload();
          return;
        }
      }
    };

    const handleVisibilityChange = () => {
      // Covers return from external payment pages where bfcache isn't used.
      if (document.visibilityState === 'visible') {
        resetUpgradeState();
      }
    };

    const handleWindowFocus = () => {
      // Additional safety net for browsers that don't emit persisted pageshow.
      resetUpgradeState();
    };

    const handlePageHide = () => {
      // Ensure bfcache snapshots do not preserve a stuck loading state.
      resetUpgradeState();
    };

    if (hasCheckoutRedirectMark()) {
      clearCheckoutRedirect();
      resetUpgradeState();
    }

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const setCheckoutRedirectMark = () => {
    sessionStorage.setItem(CHECKOUT_REDIRECT_FLAG, '1');
    localStorage.setItem(CHECKOUT_REDIRECT_FLAG_FALLBACK, '1');
  };

  const clearCheckoutRedirectMark = () => {
    sessionStorage.removeItem(CHECKOUT_REDIRECT_FLAG);
    localStorage.removeItem(CHECKOUT_REDIRECT_FLAG_FALLBACK);
  };

  const fetchUsage = async () => {
    try {
      const [usageResponse, statusResponse] = await Promise.all([
        fetch('/api/usage'),
        fetch('/api/payment/subscription-status')
      ]);

      if (usageResponse.ok) {
        const data = await usageResponse.json();
        setUsage(data);
      }

      // Check subscription status to handle edge cases
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setSubscriptionStatus(statusData);
        
        // Initialize toggle based on user's actual billing cycle
        if (statusData.billingCycle) {
          setIsAnnual(statusData.billingCycle === 'annual');
        } else if ((session?.user as any)?.billingCycle) {
          setIsAnnual((session?.user as any)?.billingCycle === 'annual');
        }
        
        if (statusData.needsUpdate) {
          // Session will be updated via the JWT callback
          console.log('🔄 Subscription status updated:', statusData);
        }
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/payment/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingCycle: isAnnual ? 'annual' : 'monthly',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          setIsUpgrading(false);
          window.location.href = data.url;
        }
      } else {
        const data = await response.json().catch(() => ({}));
        const message = typeof data?.error === 'string' ? data.error : t('alerts.failedBillingPortal');
        alert(message);
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert(t('alerts.errorOccurred'));
    }
  };

  const handleUpgrade = async (planType: PlanType) => {
    if (planType === 'free' || planType === 'team') return;

    setIsUpgrading(true);

    try {
      // Determine billing cycle based on toggle state
      const billingCycle = isAnnual ? 'annual' : 'monthly';

      // Create checkout session
      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle, planType }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Track checkout_start if server provided tracking metadata
        if (data.tracking?.trackEvent) {
          const { params } = data.tracking.trackEvent;
          trackFunnel.checkoutStart(params.user_id, params.billing_cycle, params.plan_type);
        }
        
        // Redirect to Stripe Checkout
        if (data.url) {
          setCheckoutRedirectMark();
          setIsUpgrading(false);
          window.location.href = data.url;
        } else {
          alert(t('alerts.failedCheckoutSession'));
          clearCheckoutRedirectMark();
          setIsUpgrading(false);
        }
      } else {
        const error = await response.json();
        alert(t('alerts.failedStartCheckout', { error: error.error || 'Unknown error' }));
        clearCheckoutRedirectMark();
        setIsUpgrading(false);
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert(t('alerts.errorStartCheckout'));
      clearCheckoutRedirectMark();
      setIsUpgrading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.user?.email) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        alert(t('alerts.accountDeleted'));
        router.push('/auth/signin');
      } else {
        const data = await response.json();
        alert(t('alerts.failedDeleteAccount', { error: data.error || 'Unknown error' }));
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(t('alerts.errorDeletingAccount'));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const planFeatureCounts: Record<PlanType, number> = { free: 6, standard: 7, pro: 7, team: 6 };
  const plans = [
    { type: 'free' as PlanType, icon: Check, color: 'from-gray-400 to-gray-600', popular: false, comingSoon: false },
    { type: 'standard' as PlanType, icon: Users, color: 'from-blue-500 to-cyan-500', popular: false, comingSoon: false },
    { type: 'pro' as PlanType, icon: Crown, color: 'from-indigo-500 to-purple-500', popular: true, comingSoon: false },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Active37DiscountPopup
          isOpen={false}
          onClose={() => {}}
          onUpgrade={() => {}}
        />
        <Sidebar />
        <MobileMenuButton />
        <div className="flex-1 md:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Active37DiscountPopup
        isOpen={showActive37Popup}
        onClose={() => {
          setShowActive37Popup(false);
        }}
        onUpgrade={() => {
          // User will be redirected to settings where they can upgrade
          // The discount code ACTIVE37 will be visible/mentioned in checkout
        }}
        activeDays={active37Eligibility?.activeDays || 0}
      />
      <Sidebar />
      <MobileMenuButton />
      
      <div className="flex-1 md:ml-64 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 pt-16 md:pt-8 md:p-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {t('title')}
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              {t('subtitle')}
            </p>
          </div>

          {/* Language preference (persisted for next visit) */}
          <Card className="p-4 md:p-6 mb-6 md:mb-8">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
              {tCommon('settingsLanguage')}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {tCommon('settingsLanguageRemember')}
            </p>
            <LocaleSwitcher />
          </Card>

          {/* Checkout cancelled feedback (when user left Stripe without paying) */}
          {showCheckoutFeedback && (
            <Card className="p-4 md:p-6 mb-6 md:mb-8 border-amber-200 bg-amber-50/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    {t('checkoutFeedback.title')}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('checkoutFeedback.prompt')}
                  </p>
                  {checkoutFeedbackSubmitted ? (
                    <div className="flex items-center gap-2 text-green-700">
                      <Check size={20} />
                      <span className="text-sm font-medium">{t('checkoutFeedback.thanks')}</span>
                    </div>
                  ) : (
                    <form onSubmit={handleCheckoutFeedbackSubmit} className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {t('checkoutFeedback.label')}
                        </label>
                        <textarea
                          placeholder={t('checkoutFeedback.placeholder')}
                          value={checkoutFeedbackMessage}
                          onChange={(e) => setCheckoutFeedbackMessage(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>
                      {checkoutFeedbackError && (
                        <p className="text-xs font-medium text-red-600 uppercase tracking-wide">
                          {checkoutFeedbackError}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="submit"
                          disabled={checkoutFeedbackSubmitting || !checkoutFeedbackMessage.trim()}
                        >
                          {checkoutFeedbackSubmitting ? t('checkoutFeedback.sending') : t('checkoutFeedback.send')}
                        </Button>
                        <button
                          type="button"
                          onClick={dismissCheckoutFeedback}
                          className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                          {t('checkoutFeedback.skip')}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
                {!checkoutFeedbackSubmitted && (
                  <button
                    type="button"
                    onClick={dismissCheckoutFeedback}
                    className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    aria-label="Dismiss"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* Payment failure warning banner */}
          {subscriptionStatus?.paymentGraceDeadline && (subscriptionStatus?.status === 'past_due' || subscriptionStatus?.status === 'unpaid') && (
            <Card className="p-4 md:p-6 mb-6 md:mb-8 border-red-200 bg-red-50/50">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Payment failed
                  </h2>
                  <p className="text-sm text-gray-700 mb-3">
                    We couldn&apos;t process your latest payment. Your Pro features will remain active until{' '}
                    <strong>
                      {new Date(subscriptionStatus.paymentGraceDeadline).toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </strong>
                    . Please update your payment method to avoid losing access.
                  </p>
                  <button
                    onClick={handleManageSubscription}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Update payment method
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Usage Stats */}
          {usage && (
            <Card className="p-4 md:p-6 mb-6 md:mb-8">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                {t('usage.title')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('usage.aiWordsToday')}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl md:text-3xl font-bold text-gray-900">
                      {usage.aiWordsGenerated}
                    </p>
                    {usage.limits.aiWordsPerDay != null && (
                      <p className="text-sm text-gray-500">
                        / {usage.limits.aiWordsPerDay}
                      </p>
                    )}
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{
                        width: usage.limits.aiWordsPerDay == null
                          ? '100%'
                          : `${Math.min((usage.aiWordsGenerated / usage.limits.aiWordsPerDay) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">{t('usage.plagiarismChecksToday')}</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl md:text-3xl font-bold text-gray-900">
                          {usage.plagiarismChecks}
                        </p>
                        {usage.limits.plagiarismChecksPerWeek != null ? (
                          <p className="text-sm text-gray-500">
                            / {usage.limits.plagiarismChecksPerWeek}
                          </p>
                        ) : usage.limits.plagiarismChecksPerDay !== Infinity && usage.limits.plagiarismChecksPerDay != null ? (
                          <p className="text-sm text-gray-500">
                            / {usage.limits.plagiarismChecksPerDay}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">{t('usage.paraphraseUsesToday')}</p>
                      <p className="text-2xl md:text-3xl font-bold text-gray-900">
                        {usage.paraphraseUses ?? 0}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">{t('usage.maxProjects')}</p>
                      <p className="text-2xl md:text-3xl font-bold text-gray-900">
                        {usage.limits.maxProjects == null
                          ? '∞'
                          : usage.limits.maxProjects ?? t('usage.unlimited')}
                      </p>
                    </div>
              </div>
            </Card>
          )}

          {/* Pricing Plans */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4 md:mb-6">
              {t('plans.choosePlan')}
            </h2>
            
            {/* Billing Toggle */}
            {(session?.user as any)?.plan !== 'pro' ? (
              <div className="mb-4 md:mb-6 flex flex-wrap items-center justify-center gap-3 md:gap-4">
                <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
                  {t('plans.monthly')}
                </span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsAnnual(!isAnnual);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 cursor-pointer z-10 ${
                      isAnnual ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    aria-label={t('plans.choosePlan')}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                        isAnnual ? 'translate-x-6 bg-blue-600 shadow-lg border-2 border-white' : 'translate-x-1 bg-white shadow-sm border border-gray-300'
                      }`}
                    />
                  </button>
                </div>
                <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
                  {t('plans.annual')}
                </span>
                <span
                  className={`text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium transition-opacity duration-200 ${
                    isAnnual ? 'opacity-100' : 'opacity-0'
                  }`}
                  aria-hidden={!isAnnual}
                >
                  {t('plans.savePercent', { percent: formatDiscountPercentage(getProPlanDiscount().discountPercentage) })}
                </span>
              </div>
            ) : subscriptionStatus && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 text-center">
                  <span className="font-medium">{t('plans.currentBillingCycle')} </span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {subscriptionStatus.billingCycle || 'monthly'}
                  </span>
                  {subscriptionStatus.subscriptionEnd && (
                    <>
                      {' '}•{' '}
                      <span className="text-gray-600">
                        {t('plans.renews', { date: new Date(subscriptionStatus.subscriptionEnd * 1000).toLocaleDateString() })}
                      </span>
                    </>
                  )}
                </p>
              </div>
            )}
            
            {/* AI Words Explainer */}
            <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-3">
                <Info size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">{t('plans.aiWordsExplainerTitle')}</p>
                  <p className="text-xs text-gray-600">
                    {t('plans.aiWordsExplainerBody')}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {plans.map((plan) => {
                const Icon = plan.icon;
                return (
                  <Card 
                    key={plan.type}
                    className={`p-4 md:p-6 ${plan.popular ? 'ring-2 ring-primary shadow-lg' : ''}`}
                  >
                    {plan.popular && (
                      <div className="mb-4">
                        <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-semibold rounded-full">
                          {t('plans.mostPopular')}
                        </span>
                      </div>
                    )}

                    <div className={`size-10 md:size-12 rounded-sm bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                      <Icon className="text-white" size={20} />
                    </div>

                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                      {t(`plans.${plan.type}.name`)}
                    </h3>
                    
                    <div className="mb-4 md:mb-6">
                      {(plan.type === 'pro' || plan.type === 'standard') ? (
                        <div>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-3xl md:text-4xl font-bold text-gray-900">
                              {isAnnual ? t(`plans.${plan.type}.annualPrice`) : t(`plans.${plan.type}.monthlyPrice`)}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              ({isAnnual ? t('plans.annual') : t('plans.monthly')})
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {isAnnual ? t(`plans.${plan.type}.annualPeriod`) : t(`plans.${plan.type}.monthlyPeriod`)}
                          </div>
                          <div
                            className={`text-xs text-gray-600 mt-1 min-h-[16px] transition-opacity duration-200 ${
                              isAnnual ? 'opacity-100' : 'opacity-0'
                            }`}
                            aria-hidden={!isAnnual}
                          >
                            {t(`plans.${plan.type}.billedAnnually`)}
                          </div>
                          <div
                            className={`text-xs text-blue-600 mt-1 font-medium min-h-[16px] transition-opacity duration-200 ${
                              !isAnnual ? 'opacity-100' : 'opacity-0'
                            }`}
                            aria-hidden={isAnnual}
                          >
                            {t(`plans.${plan.type}.firstMonthOff`)}
                          </div>
                          <div
                            className={`text-sm text-green-600 mt-1 font-medium min-h-[20px] transition-opacity duration-200 ${
                              isAnnual ? 'opacity-100' : 'opacity-0'
                            }`}
                            aria-hidden={!isAnnual}
                          >
                            {t(`plans.${plan.type}.annualSavings`)}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-3xl md:text-4xl font-bold text-gray-900">
                            {t(`plans.${plan.type}.price`)}
                          </span>
                          <span className="text-gray-600 ml-2">
                            {t(`plans.${plan.type}.period`)}
                          </span>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                      {Array.from({ length: planFeatureCounts[plan.type] }, (_, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="text-success mt-0.5 flex-shrink-0" size={16} />
                          <span className="text-gray-700 text-sm">{t(`plans.${plan.type}.features.${index}`)}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={plan.popular ? 'primary' : 'outline'}
                      onClick={() => plan.type !== 'free' && !plan.comingSoon && handleUpgrade(plan.type)}
                      disabled={(session?.user as any)?.plan === plan.type || plan.type === 'free' || plan.comingSoon || isUpgrading}
                    >
                      {isUpgrading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                          {t('plans.processing')}
                        </>
                      ) : (session?.user as any)?.plan === plan.type ? t('plans.currentPlan') : plan.comingSoon ? t('plans.comingSoon') : t('plans.upgrade')}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Subscription Management - Only for paying users */}
          {((session?.user as any)?.plan === 'pro' || (session?.user as any)?.plan === 'standard') && subscriptionStatus && (
            <Card className="p-4 md:p-6 mb-6 md:mb-8">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                {t('subscription.title')}
              </h2>
              <div className="space-y-4">
                <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">{t('subscription.active')}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {t('subscription.subscribedTo', { plan: (session?.user as any)?.plan === 'standard' ? 'Standard' : 'Pro', cycle: subscriptionStatus.billingCycle === 'annual' ? t('plans.annual') : t('plans.monthly') })}
                  </p>
                  {subscriptionStatus.subscriptionEnd && (
                    <p className="text-sm text-gray-600 mt-2">
                      {t('subscription.nextRenewal')} <strong>{new Date(subscriptionStatus.subscriptionEnd * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                    </p>
                  )}
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    {t('subscription.managePrompt')}
                  </p>
                  <button
                    onClick={handleManageSubscription}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    {t('subscription.manageButton')}
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Invite Friends */}
          {(session?.user as any)?.referralCode && (
            <Card className="p-4 md:p-6 mb-6 md:mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[hsl(var(--primary))]/10 rounded-(--radius) flex items-center justify-center">
                  <Gift size={20} className="text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    {t('referral.title')}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t('referral.subtitle')}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {t('referral.prompt')}
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  {t('referral.inviteMessageLabel')}
                </label>
                <p className="text-sm text-gray-700 mb-3">
                  {t('referral.inviteMessageBody')} <span className="font-semibold text-[hsl(var(--primary))]">{(session?.user as any)?.referralCode ? buildReferralLink((session?.user as any)?.referralCode) : 'https://useakowe.com'}</span>
                </p>
                <button
                  onClick={() => {
                    const referralCode = (session?.user as any)?.referralCode;
                    const referralUrl = referralCode ? buildReferralLink(referralCode) : 'https://useakowe.com';
                    const message = `${t('referral.inviteMessageBody')} ${referralUrl}`;
                    navigator.clipboard.writeText(message);
                    setCopiedReferral(true);
                    setTimeout(() => setCopiedReferral(false), 2000);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border-2 border-[hsl(var(--border-strong))] bg-white rounded-(--radius) hover:bg-gray-50 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  {copiedReferral ? (
                    <>
                      <Check size={16} className="text-green-600" />
                      <span className="text-green-600">{t('referral.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>{t('referral.copyMessage')}</span>
                    </>
                  )}
                </button>
              </div>
            </Card>
          )}

          {/* Account Settings */}
          <Card className="p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              {t('account.title')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('account.email')}
                </label>
                <p className="text-gray-900 break-all">{session?.user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('account.name')}
                </label>
                <p className="text-gray-900">{session?.user?.name}</p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  {t('account.deleteAccount')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-4 md:p-6 relative">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              disabled={isDeleting}
            >
              <X size={20} />
            </button>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
              {t('deleteModal.title')}
            </h3>
            <p className="text-gray-700 text-sm md:text-base mb-6">
              {t('deleteModal.body')}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                {t('deleteModal.cancel')}
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? t('deleteModal.deleting') : t('deleteModal.confirm')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
