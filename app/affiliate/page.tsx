'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DollarSign, Link2, BarChart3, Mail, CheckCircle, ArrowRight, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export default function AffiliateProgramPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [copiedLink, setCopiedLink] = useState(false);

  const referralCode = (session?.user as any)?.referralCode;
  const referralLink = referralCode ? `https://useakowe.com/?ref=${referralCode}` : null;

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.16em] mb-4">
            Affiliate Program
          </h1>
          <p className="text-lg text-[hsl(var(--muted-foreground))] uppercase tracking-[0.2em] max-w-2xl mx-auto">
            Earn $0.20 for every signup you refer
          </p>
        </div>

        {/* Benefits Section */}
        <div className="bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] p-4 sm:p-6 lg:p-8 rounded-lg mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-[0.16em] mb-4 sm:mb-6 text-center">
            Program Benefits
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-4 sm:p-6 rounded">
              <div className="flex items-start gap-3 sm:gap-4">
                <DollarSign className="text-[hsl(var(--primary))] flex-shrink-0 mt-1 w-5 h-5 sm:w-6 sm:h-6" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em] mb-2">
                    $0.20 Per Signup
                  </h3>
                  <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
                    Earn $0.20 for every person who signs up using your referral link
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-4 sm:p-6 rounded">
              <div className="flex items-start gap-3 sm:gap-4">
                <BarChart3 className="text-[hsl(var(--primary))] flex-shrink-0 mt-1 w-5 h-5 sm:w-6 sm:h-6" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em] mb-2">
                    Real-Time Tracking
                  </h3>
                  <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
                    Monitor clicks, signups, and conversion rates instantly
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-4 sm:p-6 rounded">
              <div className="flex items-start gap-3 sm:gap-4">
                <CheckCircle className="text-[hsl(var(--primary))] flex-shrink-0 mt-1 w-5 h-5 sm:w-6 sm:h-6" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em] mb-2">
                    Monthly Payouts
                  </h3>
                  <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
                    Payments processed at the end of each month
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-4 sm:p-6 rounded">
              <div className="flex items-start gap-3 sm:gap-4">
                <Link2 className="text-[hsl(var(--primary))] flex-shrink-0 mt-1 w-5 h-5 sm:w-6 sm:h-6" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em] mb-2">
                    Easy Sharing
                  </h3>
                  <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
                    Simple referral link works on any platform or channel
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] p-4 sm:p-6 lg:p-8 rounded-lg mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-[0.16em] mb-4 sm:mb-6 text-center">
            How It Works
          </h2>

          <div className="space-y-4 sm:space-y-6">
            {/* Step 1 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-full flex items-center justify-center font-bold text-base sm:text-lg">
                1
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em] mb-2">
                  Get Your Referral Link
                </h3>
                <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em] mb-3">
                  Every user automatically receives a unique referral code when they sign up. Find yours in your Settings page.
                </p>
                {status === 'authenticated' && referralCode ? (
                  <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-3 sm:p-4 rounded">
                    <div className="mb-2">
                      <span className="text-xs uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))]">
                        Your Referral Link:
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <code className="flex-1 text-xs sm:text-sm font-mono bg-[hsl(var(--surface-muted))] px-2 sm:px-3 py-2 rounded border border-[hsl(var(--border-strong))] break-all overflow-x-auto">
                        {referralLink}
                      </code>
                      <button
                        onClick={handleCopyLink}
                        className="px-3 sm:px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded uppercase tracking-[0.12em] text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        {copiedLink ? (
                          <>
                            <CheckCircle size={14} />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={() => router.push('/settings')}
                        className="text-xs text-[hsl(var(--primary))] uppercase tracking-[0.15em] hover:underline flex items-center gap-1"
                      >
                        View in Settings
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-3 sm:p-4 rounded">
                    <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em] mb-3">
                      Sign up or log in to get your referral link
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => router.push('/auth/signup')}
                        className="flex-1 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded uppercase tracking-[0.12em] text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        Sign Up
                      </button>
                      <button
                        onClick={() => router.push('/auth/signin')}
                        className="flex-1 px-4 py-2 border-2 border-[hsl(var(--border-strong))] rounded uppercase tracking-[0.12em] text-xs font-semibold hover:bg-[hsl(var(--surface-muted))] transition-colors"
                      >
                        Log In
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-full flex items-center justify-center font-bold text-base sm:text-lg">
                2
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em] mb-2">
                  Share Your Link
                </h3>
                <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
                  Share your referral link anywhere—social media, email, blog posts, or direct messages. Anyone who clicks and signs up counts toward your earnings.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-full flex items-center justify-center font-bold text-base sm:text-lg">
                3
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em] mb-2">
                  Track Your Performance
                </h3>
                <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em] mb-3">
                  Visit the Affiliate Stats page to see your monthly clicks, signups, and conversion rate. Stats are shown per month, and each signup is counted only once—no double payments.
                </p>
                <button
                  onClick={() => router.push('/affiliate-stats')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded uppercase tracking-[0.12em] text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  View Stats
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-full flex items-center justify-center font-bold text-base sm:text-lg">
                4
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em] mb-2">
                  Get Paid
                </h3>
                <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em] mb-3">
                  At the end of each month, take a screenshot of your monthly stats from the Affiliate Stats page and email it to us. We&apos;ll process your payment based on that month&apos;s signups. Each signup is paid only once—you won&apos;t see the same users counted in multiple months.
                </p>
                <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-3 sm:p-4 rounded">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Mail className="text-[hsl(var(--primary))] flex-shrink-0 mt-0.5 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-1">
                        Send Payment Request To:
                      </p>
                      <a
                        href="mailto:affiliate@placeholderllc.name.ng"
                        className="text-xs sm:text-sm font-mono text-[hsl(var(--primary))] hover:underline break-all"
                      >
                        affiliate@placeholderllc.name.ng
                      </a>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em] mt-2">
                        Include your referral code and the screenshot of your stats
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] p-4 sm:p-6 lg:p-8 rounded-lg mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-[0.16em] mb-4 sm:mb-6 text-center">
            Payment Details
          </h2>
          
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-4 sm:p-6 rounded">
              <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em] mb-2 sm:mb-3">
                Payment Amount
              </h3>
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em] mb-2">
                $0.20 USD per successful signup
              </p>
            </div>

            <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-4 sm:p-6 rounded">
              <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em] mb-2 sm:mb-3">
                Payment Schedule
              </h3>
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em] mb-2">
                Payments are processed at the end of each calendar month. Stats are tracked monthly, and each signup is counted only once—you&apos;ll only see new signups from the current month in your stats.
              </p>
            </div>

            <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-4 sm:p-6 rounded">
              <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em] mb-2 sm:mb-3">
                How to Request Payment
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
                <li>Visit the <button onClick={() => router.push('/affiliate-stats')} className="text-[hsl(var(--primary))] hover:underline">Affiliate Stats</button> page</li>
                <li>Enter your referral code or link to view your monthly stats</li>
                <li>Select the month you want to request payment for (defaults to current month)</li>
                <li>Take a screenshot of your stats showing signups for that month</li>
                <li>Email the screenshot to <a href="mailto:affiliate@placeholderllc.name.ng" className="text-[hsl(var(--primary))] hover:underline font-mono break-all">affiliate@placeholderllc.name.ng</a></li>
                <li>Include your referral code and the month in the email</li>
                <li>We&apos;ll process your payment within 5-7 business days</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => router.push('/affiliate-stats')}
            className="bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] p-4 sm:p-6 rounded-lg hover:bg-[hsl(var(--surface-muted))] transition-colors text-left"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <BarChart3 className="text-[hsl(var(--primary))] w-5 h-5 sm:w-6 sm:h-6" />
              <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em]">
                View Your Stats
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
              Check your clicks, signups, and conversion rate
            </p>
          </button>

          {status === 'authenticated' ? (
            <button
              onClick={() => router.push('/settings')}
              className="bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] p-4 sm:p-6 rounded-lg hover:bg-[hsl(var(--surface-muted))] transition-colors text-left"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Link2 className="text-[hsl(var(--primary))] w-5 h-5 sm:w-6 sm:h-6" />
                <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em]">
                  Get Your Link
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
                Find your referral code in Settings
              </p>
            </button>
          ) : (
            <button
              onClick={() => router.push('/auth/signup')}
              className="bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] p-4 sm:p-6 rounded-lg hover:bg-[hsl(var(--surface-muted))] transition-colors text-left"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <CheckCircle className="text-[hsl(var(--primary))] w-5 h-5 sm:w-6 sm:h-6" />
                <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em]">
                  Join the Program
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
                Sign up to get your referral link
              </p>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.18em] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
