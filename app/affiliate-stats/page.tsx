'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

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
    month: number;
    year: number;
    monthName: string;
    period: string;
  } | null>(null);
  
  // Default to current month
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Reusable function to fetch stats
  const fetchStats = async () => {
    if (!input.trim()) {
      setError('Please enter a referral code or link');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (input.includes('http') || input.includes('?ref=')) {
        params.append('link', input.trim());
      } else {
        params.append('code', input.trim());
      }
      params.append('month', selectedMonth.toString());
      params.append('year', selectedYear.toString());
      
      const response = await fetch(`/api/affiliate/stats?${params.toString()}`);
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStats(null); // Clear stats on new submit
    await fetchStats();
  };

  const handleRefresh = async () => {
    await fetchStats();
  };

  // Auto-submit when month/year changes if we already have stats
  useEffect(() => {
    if (stats && input.trim()) {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-[0.16em] mb-2">
            Affiliate Stats
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm uppercase tracking-[0.2em]">
            Track your monthly referral performance
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="month-select" className="block text-sm font-semibold uppercase tracking-[0.18em] mb-2">
                  Month
                </label>
                <select
                  id="month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] rounded focus:outline-none focus:border-[hsl(var(--primary))] uppercase tracking-[0.1em]"
                >
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>
              <div>
                <label htmlFor="year-select" className="block text-sm font-semibold uppercase tracking-[0.18em] mb-2">
                  Year
                </label>
                <select
                  id="year-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] rounded focus:outline-none focus:border-[hsl(var(--primary))] uppercase tracking-[0.1em]"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = now.getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.15em]">
              Stats shown are for the selected month only. Each signup is counted once.
            </p>

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
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold uppercase tracking-[0.16em]">
                Your Stats
              </h2>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--background))] border-2 border-[hsl(var(--border-strong))] rounded uppercase tracking-[0.12em] text-xs font-semibold hover:bg-[hsl(var(--surface-muted))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh stats"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.15em] text-center mb-6">
              {stats.period}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-4 rounded text-center">
                <div className="text-3xl font-bold mb-2 text-[hsl(var(--primary))]">
                  {stats.clicks}
                </div>
                <div className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  Clicks This Month
                </div>
              </div>

              <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))] p-4 rounded text-center">
                <div className="text-3xl font-bold mb-2 text-[hsl(var(--primary))]">
                  {stats.signups}
                </div>
                <div className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  Signups This Month
                </div>
                <div className="text-xs text-[hsl(var(--primary))] font-semibold mt-2 uppercase tracking-[0.15em]">
                  ${(stats.signups * 0.2).toFixed(2)} earned
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
              <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em] text-center mt-2">
                These stats are for {stats.period} only. Each signup is counted once.
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
