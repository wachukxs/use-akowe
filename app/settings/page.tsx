'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar, { MobileMenuButton } from '@/components/Sidebar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { UsageLimits, PlanType } from '@/types';
import { Check, Crown, Users, X, Info, Copy, Gift } from 'lucide-react';

interface UsageData {
  aiWordsGenerated: number;
  plagiarismChecks: number;
  limits: UsageLimits;
}

export default function SettingsPage() {
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUsage();
    }
  }, [session]);

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
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        alert('Failed to open billing portal. Please try again.');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleUpgrade = async (planType: PlanType) => {
    if (planType === 'free') return;
    
    setIsUpgrading(true);
    
    try {
      // Determine billing cycle based on toggle state
      const billingCycle = isAnnual ? 'annual' : 'monthly';
      
      // Create checkout session
      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Redirect to Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Failed to create checkout session. Please try again.');
          setIsUpgrading(false);
        }
      } else {
        const error = await response.json();
        alert(`Failed to start checkout: ${error.error || 'Unknown error'}`);
        setIsUpgrading(false);
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert('An error occurred while starting checkout. Please try again.');
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
        alert('Account deleted successfully. You will be redirected to the sign-in page.');
        router.push('/auth/signin');
      } else {
        const data = await response.json();
        alert(`Failed to delete account: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('An error occurred while deleting your account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      type: 'free' as PlanType,
      icon: Check,
      color: 'from-gray-400 to-gray-600',
          features: [
            '1,500 AI words per day',
            // '100 AI auto-complete (one-time)', // Coming soon
            '3 plagiarism checks per day',
            '3 projects maximum',
            'Smart citation search',
            'Basic citation support',
          ],
    },
    {
      name: 'Pro',
      monthlyPrice: '$19',
      monthlyPeriod: 'per month',
      annualPrice: '$120',
      annualPeriod: 'per year',
      annualSavings: 'Save $108 per year',
      type: 'pro' as PlanType,
      icon: Crown,
      // Use standard Tailwind colors to ensure the gradient class resolves
      color: 'from-indigo-500 to-purple-500',
          features: [
            'Unlimited AI words',
            // 'Unlimited AI auto-complete (faster model)', // Coming soon
            'Unlimited plagiarism checks',
            'Unlimited projects',
            'Advanced citation search',
            'GPT-4 access',
            'Priority support',
          ],
      popular: true,
    },
    {
      name: 'Team',
      price: 'Coming Soon',
      period: '',
      type: 'team' as PlanType,
      icon: Users,
      // Use standard Tailwind colors to ensure the gradient class resolves
      color: 'from-teal-500 to-blue-500',
          features: [
            'Everything in Pro',
            '10 team members',
            'Shared workspaces',
            'Admin controls',
            'Shared citation library',
            'Team analytics',
          ],
      comingSoon: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <MobileMenuButton />
        <div className="flex-1 md:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <MobileMenuButton />
      
      <div className="flex-1 md:ml-64 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 pt-16 md:pt-8 md:p-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Settings
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Manage your account and subscription
            </p>
          </div>

          {/* Usage Stats */}
          {usage && (
            <Card className="p-4 md:p-6 mb-6 md:mb-8">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                Current Usage
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">AI Words Today</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl md:text-3xl font-bold text-gray-900">
                      {usage.aiWordsGenerated}
                    </p>
                    {usage.limits.aiWordsPerDay !== Infinity && (
                      <p className="text-sm text-gray-500">
                        / {usage.limits.aiWordsPerDay}
                      </p>
                    )}
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{
                        width: usage.limits.aiWordsPerDay === Infinity 
                          ? '100%' 
                          : `${Math.min((usage.aiWordsGenerated / usage.limits.aiWordsPerDay) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Plagiarism Checks Today</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl md:text-3xl font-bold text-gray-900">
                          {usage.plagiarismChecks}
                        </p>
                        {usage.limits.plagiarismChecksPerDay !== Infinity && (
                          <p className="text-sm text-gray-500">
                            / {usage.limits.plagiarismChecksPerDay}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Max Projects</p>
                      <p className="text-2xl md:text-3xl font-bold text-gray-900">
                        {usage.limits.maxProjects === Infinity 
                          ? '∞' 
                          : usage.limits.maxProjects || 'Unlimited'}
                      </p>
                    </div>
              </div>
            </Card>
          )}

          {/* Pricing Plans */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4 md:mb-6">
              Choose Your Plan
            </h2>
            
            {/* Billing Toggle */}
            {(session?.user as any)?.plan !== 'pro' ? (
              <div className="mb-4 md:mb-6 flex flex-wrap items-center justify-center gap-3 md:gap-4">
                <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
                  Monthly
                </span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Toggle clicked, current isAnnual:', isAnnual);
                      setIsAnnual(!isAnnual);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 cursor-pointer z-10 ${
                      isAnnual ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    aria-label={`Switch to ${isAnnual ? 'monthly' : 'annual'} billing`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                        isAnnual ? 'translate-x-6 bg-blue-600 shadow-lg border-2 border-white' : 'translate-x-1 bg-white shadow-sm border border-gray-300'
                      }`}
                    />
                  </button>
                </div>
                <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
                  Annual
                </span>
                <span
                  className={`text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium transition-opacity duration-200 ${
                    isAnnual ? 'opacity-100' : 'opacity-0'
                  }`}
                  aria-hidden={!isAnnual}
                >
                  Save 47%
                </span>
              </div>
            ) : subscriptionStatus && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 text-center">
                  <span className="font-medium">Current billing cycle: </span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {subscriptionStatus.billingCycle || 'monthly'}
                  </span>
                  {subscriptionStatus.subscriptionEnd && (
                    <>
                      {' '}•{' '}
                      <span className="text-gray-600">
                        Renews {new Date(subscriptionStatus.subscriptionEnd * 1000).toLocaleDateString()}
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
                  <p className="text-sm font-medium text-gray-900 mb-1">What counts as AI words?</p>
                  <p className="text-xs text-gray-600">
                    AI words include all content generated by Akowe: <strong className="text-gray-700">AI Assistant responses</strong>, <strong className="text-gray-700">"Write for me"</strong> content, and <strong className="text-gray-700">AI-generated outlines</strong>. Your own writing doesn&apos;t count toward the limit.
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
                          MOST POPULAR
                        </span>
                      </div>
                    )}

                    <div className={`size-10 md:size-12 rounded-sm bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                      <Icon className="text-white" size={20} />
                    </div>

                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    
                    <div className="mb-4 md:mb-6">
                      {plan.monthlyPrice ? (
                        <div>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-3xl md:text-4xl font-bold text-gray-900">
                              {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                            </span>
                            {/* Debug info */}
                            <span className="text-xs text-gray-400 ml-2">
                              ({isAnnual ? 'annual' : 'monthly'})
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {isAnnual ? plan.annualPeriod : plan.monthlyPeriod}
                          </div>
                          {plan.annualSavings && (
                            <div
                              className={`text-sm text-green-600 mt-1 font-medium min-h-[20px] transition-opacity duration-200 ${
                                isAnnual ? 'opacity-100' : 'opacity-0'
                              }`}
                              aria-hidden={!isAnnual}
                            >
                              {plan.annualSavings}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="text-3xl md:text-4xl font-bold text-gray-900">
                            {plan.price}
                          </span>
                          <span className="text-gray-600 ml-2">
                            {plan.period}
                          </span>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="text-success mt-0.5 flex-shrink-0" size={16} />
                          <span className="text-gray-700 text-sm">{feature}</span>
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
                          Processing...
                        </>
                      ) : (session?.user as any)?.plan === plan.type ? 'Current Plan' : plan.comingSoon ? 'Coming Soon' : 'Upgrade'}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Subscription Management - Only for Pro users */}
          {(session?.user as any)?.plan === 'pro' && subscriptionStatus && (
            <Card className="p-4 md:p-6 mb-6 md:mb-8">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                Subscription Management
              </h2>
              <div className="space-y-4">
                <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">Active Subscription</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    You&apos;re subscribed to the <strong>Pro plan</strong> with <strong className="capitalize">{subscriptionStatus.billingCycle || 'monthly'}</strong> billing.
                  </p>
                  {subscriptionStatus.subscriptionEnd && (
                    <p className="text-sm text-gray-600 mt-2">
                      Next renewal: <strong>{new Date(subscriptionStatus.subscriptionEnd * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                    </p>
                  )}
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    Need to cancel your subscription? You can manage your subscription and billing through Stripe.
                  </p>
                  <button
                    onClick={handleManageSubscription}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    Manage Subscription →
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Invite Friends */}
          {(session?.user as any)?.referralCode && (
            <Card className="p-4 md:p-6 mb-6 md:mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[hsl(var(--primary))]/10 rounded-[var(--radius)] flex items-center justify-center">
                  <Gift size={20} className="text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    Invite Friends & Colleagues
                  </h2>
                  <p className="text-sm text-gray-500">
                    Share Akowe with your network
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Know someone who could benefit from AI-powered academic writing? Share your personal invite link with them!
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Your Invite Message
                </label>
                <p className="text-sm text-gray-700 mb-3">
                  Hey! I&apos;ve been using Akowe for my academic writing and it&apos;s been super helpful. You should try it out: <span className="font-semibold text-[hsl(var(--primary))]">https://useakowe.com/?ref={(session?.user as any)?.referralCode}</span>
                </p>
                <button
                  onClick={() => {
                    const message = `Hey! I've been using Akowe for my academic writing and it's been super helpful. You should try it out: https://useakowe.com/?ref=${(session?.user as any)?.referralCode}`;
                    navigator.clipboard.writeText(message);
                    setCopiedReferral(true);
                    setTimeout(() => setCopiedReferral(false), 2000);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border-2 border-[hsl(var(--border-strong))] bg-white rounded-[var(--radius)] hover:bg-gray-50 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  {copiedReferral ? (
                    <>
                      <Check size={16} className="text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>Copy Invite Message</span>
                    </>
                  )}
                </button>
              </div>
            </Card>
          )}

          {/* Account Settings */}
          <Card className="p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Account Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900 break-all">{session?.user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <p className="text-gray-900">{session?.user?.name}</p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
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
              Delete Account?
            </h3>
            <p className="text-gray-700 text-sm md:text-base mb-6">
              Are you sure you want to delete your account? This action cannot be undone. 
              All your projects, citations, and data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
