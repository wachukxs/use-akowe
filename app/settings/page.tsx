'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { UsageLimits, PlanType } from '@/types';
import { Check, Crown, Users, X } from 'lucide-react';

interface UsageData {
  aiWordsGenerated: number;
  plagiarismChecks: number;
  limits: UsageLimits;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnnual, setIsAnnual] = useState(true); // Default to annual billing

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

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = (planType: PlanType) => {
    // TODO: Implement payment integration (Stripe, etc.)
    alert(`Upgrade to ${planType} plan is coming soon! We'll integrate payment processing in the next phase.`);
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
            '100 AI auto-complete (one-time)',
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
      color: 'from-primary to-accent-purple',
          features: [
            'Unlimited AI words',
            'Unlimited AI auto-complete (faster model)',
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
      color: 'from-accent-teal to-accent-blue',
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
        <div className="flex-1 ml-64 flex items-center justify-center">
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
      
      <div className="flex-1 ml-64 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Settings
            </h1>
            <p className="text-gray-600">
              Manage your account and subscription
            </p>
          </div>

          {/* Usage Stats */}
          {usage && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Current Usage
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">AI Words Today</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-gray-900">
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
                        <p className="text-3xl font-bold text-gray-900">
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
                      <p className="text-3xl font-bold text-gray-900">
                        {usage.limits.maxProjects === Infinity 
                          ? '∞' 
                          : usage.limits.maxProjects || 'Unlimited'}
                      </p>
                    </div>
              </div>
            </Card>
          )}

          {/* Pricing Plans */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Choose Your Plan
            </h2>
            
            {/* Billing Toggle */}
            <div className="mb-6 flex items-center justify-center gap-4">
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
              {isAnnual && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                  Save 47%
                </span>
              )}
            </div>
            
            {/* AI Words Explainer */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">ℹ️</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">What counts as AI words?</p>
                  <p className="text-xs text-blue-700">
                    AI words include all content generated by Akowe: <strong>chat responses</strong>, <strong>"Write for me"</strong> content, and <strong>AI-generated outlines</strong>. Your own writing doesn&apos;t count toward the limit.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const Icon = plan.icon;
                return (
                  <Card 
                    key={plan.type}
                    className={`p-6 ${plan.popular ? 'ring-2 ring-primary shadow-lg' : ''}`}
                  >
                    {plan.popular && (
                      <div className="mb-4">
                        <span className="px-3 py-1 bg-gradient-to-r from-primary to-accent-purple text-white text-xs font-semibold rounded-full">
                          MOST POPULAR
                        </span>
                      </div>
                    )}

                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                      <Icon className="text-white" size={24} />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    
                    <div className="mb-6">
                      {plan.monthlyPrice ? (
                        <div>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-4xl font-bold text-gray-900">
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
                          {isAnnual && plan.annualSavings && (
                            <div className="text-sm text-green-600 mt-1 font-medium">
                              {plan.annualSavings}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="text-4xl font-bold text-gray-900">
                            {plan.price}
                          </span>
                          <span className="text-gray-600 ml-2">
                            {plan.period}
                          </span>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="text-success mt-0.5 flex-shrink-0" size={18} />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={plan.popular ? 'primary' : 'outline'}
                      onClick={() => plan.type !== 'free' && !plan.comingSoon && handleUpgrade(plan.type)}
                      disabled={plan.type === 'free' || plan.comingSoon}
                    >
                      {plan.type === 'free' ? 'Current Plan' : plan.comingSoon ? 'Coming Soon' : 'Upgrade'}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Account Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Account Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{session?.user?.email}</p>
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
          <Card className="max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              disabled={isDeleting}
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Delete Account?
            </h3>
            <p className="text-gray-700 mb-6">
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

