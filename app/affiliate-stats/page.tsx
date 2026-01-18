'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AffiliateStatsPage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    referralCode: string;
    clicks: number;
    signups: number;
    conversionRate: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      setError('Please enter a referral code or link');
      return;
    }

    setLoading(true);
    setError(null);
    setStats(null);

    try {
      const response = await fetch(`/api/affiliate/stats?${input.includes('http') || input.includes('?ref=') ? 'link=' : 'code='}${encodeURIComponent(input.trim())}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-[0.16em] mb-2">
            Affiliate Stats
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm uppercase tracking-[0.2em]">
            Track your referral performance
          </p>
        </div>

        <div className="bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] p-6 rounded-lg mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="referral-input" className="block text-sm font-semibold uppercase tracking-[0.18em] mb-2">
                Enter Your Referral Code or Link
              </label>
              <input
                id="referral-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="ABC123 or https://useakowe.com/?ref=ABC123"
                className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] rounded focus:outline-none focus:border-[hsl(var(--primary))] uppercase tracking-[0.1em]"
              />
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.15em]">
                Paste your referral code or full referral link
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-6 py-3 font-semibold uppercase tracking-[0.18em] rounded transition-transform duration-150 hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Loading...' : 'View Stats'}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-500/10 border-2 border-red-500 p-4 rounded-lg mb-6">
            <p className="text-red-500 text-sm uppercase tracking-[0.15em]">{error}</p>
          </div>
        )}

        {stats && (
          <div className="bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] p-6 rounded-lg">
            <h2 className="text-xl font-bold uppercase tracking-[0.16em] mb-6 text-center">
              Your Stats
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-4 rounded text-center">
                <div className="text-3xl font-bold mb-2 text-[hsl(var(--primary))]">
                  {stats.clicks}
                </div>
                <div className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  Total Clicks
                </div>
              </div>

              <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-4 rounded text-center">
                <div className="text-3xl font-bold mb-2 text-[hsl(var(--primary))]">
                  {stats.signups}
                </div>
                <div className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  Total Signups
                </div>
              </div>

              <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-4 rounded text-center">
                <div className="text-3xl font-bold mb-2 text-[hsl(var(--primary))]">
                  {stats.conversionRate}
                </div>
                <div className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  Conversion Rate
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[hsl(var(--border-strong))]">
              <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.15em] text-center">
                Referral Code: <span className="font-mono font-bold">{stats.referralCode}</span>
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
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
