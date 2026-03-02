'use client';

import { useRouter } from '@/i18n/navigation';
import { DollarSign, Link2, BarChart3, Mail, CheckCircle, Send } from 'lucide-react';
import { useState } from 'react';

type ApplicationStatus = 'idle' | 'submitting' | 'success' | 'error';

interface ApplicationForm {
  name: string;
  email: string;
  website: string;
  promotionMethod: string;
  audienceSize: string;
  message: string;
}

export default function AffiliateProgramPage() {
  const router = useRouter();
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>('idle');
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [applicationForm, setApplicationForm] = useState<ApplicationForm>({
    name: '',
    email: '',
    website: '',
    promotionMethod: '',
    audienceSize: '',
    message: '',
  });

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplicationStatus('submitting');
    setApplicationError(null);
    try {
      const response = await fetch('/api/affiliate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationForm),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit application');
      }
      setApplicationStatus('success');
    } catch (err) {
      setApplicationError(err instanceof Error ? err.message : 'Failed to submit application');
      setApplicationStatus('error');
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
            Earn 30% recurring commission — first 12 months or lifetime of subscription, whichever is shorter
          </p>
        </div>

        {/* Benefits */}
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
                    30% Recurring For 12 Months
                  </h3>
                  <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
                    Earn 30% of every payment your referred user makes — for their first 12 months or for as long as they stay subscribed, whichever is shorter
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
                    Monitor clicks, signups, paid conversions, and commissions earned instantly
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

        {/* How It Works */}
        <div className="bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] p-4 sm:p-6 lg:p-8 rounded-lg mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-[0.16em] mb-4 sm:mb-6 text-center">
            How It Works
          </h2>

          <div className="space-y-4 sm:space-y-6">
            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-full flex items-center justify-center font-bold text-base sm:text-lg">
                1
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em] mb-2">
                  Submit Your Application
                </h3>
                <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
                  Fill out the form below with your channel, audience size, and how you plan to promote Akowe. No Akowe account required.
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-full flex items-center justify-center font-bold text-base sm:text-lg">
                2
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em] mb-2">
                  We Review Your Application
                </h3>
                <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
                  We keep the program selective — we&apos;re looking for affiliates who reach students, academics, and researchers. You&apos;ll hear back at your email within a few days.
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-full flex items-center justify-center font-bold text-base sm:text-lg">
                3
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em] mb-2">
                  Get Your Dedicated Code
                </h3>
                <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
                  If approved, you&apos;ll receive an email with your unique referral code and a ready-to-use link. That&apos;s your tracking ID — every signup and payment attributed to it is yours.
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-full flex items-center justify-center font-bold text-base sm:text-lg">
                4
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em] mb-2">
                  Promote and Get Paid
                </h3>
                <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em] mb-3">
                  Share your link on any channel — ads, content, newsletters. Every paying subscriber you bring in earns you 30% for their first 12 months. Track your stats anytime at the Affiliate Stats page using your code. At the end of each month, email us to request payout.
                </p>
                <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-3 sm:p-4 rounded">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Mail className="text-[hsl(var(--primary))] flex-shrink-0 mt-0.5 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-1">
                        Request Payout:
                      </p>
                      <a
                        href="mailto:affiliate@placeholderllc.name.ng"
                        className="text-xs sm:text-sm font-mono text-[hsl(var(--primary))] hover:underline break-all"
                      >
                        affiliate@placeholderllc.name.ng
                      </a>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em] mt-2">
                        Include your referral code and payout details (PayPal, bank transfer, etc.)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] p-4 sm:p-6 lg:p-8 rounded-lg mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-[0.16em] mb-6 text-center">
            Apply Now
          </h2>

          {applicationStatus === 'success' ? (
            <div className="bg-[hsl(var(--background))] border-2 border-[hsl(var(--primary))] p-6 rounded-lg text-center space-y-3">
              <CheckCircle className="text-[hsl(var(--primary))] mx-auto" size={40} />
              <p className="text-sm font-semibold uppercase tracking-[0.16em]">Application Submitted!</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
                We&apos;ll review your application and reach out to you at the email you provided.
              </p>
            </div>
          ) : (
            <form onSubmit={handleApplicationSubmit} className="space-y-4">
              {applicationStatus === 'error' && applicationError && (
                <div className="border-2 border-[hsl(var(--destructive))] bg-[hsl(var(--background))] p-3 rounded text-xs text-[hsl(var(--destructive))]">
                  {applicationError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                    Name <span className="text-[hsl(var(--destructive))]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={applicationForm.name}
                    onChange={(e) => setApplicationForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full bg-[hsl(var(--background))] border-2 border-[hsl(var(--border-strong))] rounded px-3 py-2 text-sm focus:outline-none focus:border-[hsl(var(--primary))]"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                    Email <span className="text-[hsl(var(--destructive))]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={applicationForm.email}
                    onChange={(e) => setApplicationForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full bg-[hsl(var(--background))] border-2 border-[hsl(var(--border-strong))] rounded px-3 py-2 text-sm focus:outline-none focus:border-[hsl(var(--primary))]"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                    Promotion Method <span className="text-[hsl(var(--destructive))]">*</span>
                  </label>
                  <select
                    required
                    value={applicationForm.promotionMethod}
                    onChange={(e) => setApplicationForm((f) => ({ ...f, promotionMethod: e.target.value }))}
                    className="w-full bg-[hsl(var(--background))] border-2 border-[hsl(var(--border-strong))] rounded px-3 py-2 text-sm focus:outline-none focus:border-[hsl(var(--primary))]"
                  >
                    <option value="">Select a method</option>
                    <option value="blog">Blog / Content</option>
                    <option value="youtube">YouTube</option>
                    <option value="social_media">Social Media</option>
                    <option value="paid_ads">Paid Ads</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                    Audience Size
                  </label>
                  <input
                    type="text"
                    value={applicationForm.audienceSize}
                    onChange={(e) => setApplicationForm((f) => ({ ...f, audienceSize: e.target.value }))}
                    className="w-full bg-[hsl(var(--background))] border-2 border-[hsl(var(--border-strong))] rounded px-3 py-2 text-sm focus:outline-none focus:border-[hsl(var(--primary))]"
                    placeholder="e.g. 10k–50k"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                  Website / Channel URL
                </label>
                <input
                  type="text"
                  value={applicationForm.website}
                  onChange={(e) => setApplicationForm((f) => ({ ...f, website: e.target.value }))}
                  className="w-full bg-[hsl(var(--background))] border-2 border-[hsl(var(--border-strong))] rounded px-3 py-2 text-sm focus:outline-none focus:border-[hsl(var(--primary))]"
                  placeholder="youtube.com/yourchannel or yoursite.com"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                  Why do you want to partner with Akowe?
                </label>
                <textarea
                  rows={3}
                  value={applicationForm.message}
                  onChange={(e) => setApplicationForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full bg-[hsl(var(--background))] border-2 border-[hsl(var(--border-strong))] rounded px-3 py-2 text-sm focus:outline-none focus:border-[hsl(var(--primary))] resize-none"
                  placeholder="Tell us a bit about your audience and how you plan to promote Akowe..."
                />
              </div>

              <button
                type="submit"
                disabled={applicationStatus === 'submitting'}
                className="w-full sm:w-auto px-6 py-3 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded uppercase tracking-[0.16em] text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={14} />
                {applicationStatus === 'submitting' ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          )}
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
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
                30% of every payment from each paying subscriber you refer — for their first 12 months or for as long as they stay subscribed, whichever is shorter. A monthly subscriber ($12/mo) earns you $3.60 per renewal, up to $43.20 if they stay the full 12 months. An annual subscriber ($120/yr) earns you $36 on their first payment.
              </p>
            </div>

            <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-4 sm:p-6 rounded">
              <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em] mb-2 sm:mb-3">
                Payment Schedule
              </h3>
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
                Payments are processed at the end of each calendar month. You earn a commission each time your referred user is billed — every month they stay subscribed, for their first 12 months or the lifetime of their subscription, whichever is shorter. If they cancel, commissions stop. If they stay the full 12 months, so do your commissions.
              </p>
            </div>

            <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-4 sm:p-6 rounded">
              <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.14em] mb-2 sm:mb-3">
                How to Request Payment
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
                <li>At the end of the month, email <a href="mailto:affiliate@placeholderllc.name.ng" className="text-[hsl(var(--primary))] hover:underline font-mono break-all">affiliate@placeholderllc.name.ng</a></li>
                <li>Include your referral code and your preferred payout method (PayPal, bank transfer, etc.)</li>
                <li>We verify your commission balance in our system — no screenshots or manual proof required</li>
                <li>Payment is processed within 5–7 business days</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Existing user note */}
        <p className="text-center text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.16em] mb-8">
          Already an Akowe user?{' '}
          <button
            onClick={() => router.push('/settings')}
            className="text-[hsl(var(--primary))] hover:underline"
          >
            Your referral link is in Settings
          </button>
          {' '}— it works on the same 30% commission terms.
        </p>

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
