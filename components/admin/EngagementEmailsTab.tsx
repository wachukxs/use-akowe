'use client';

import { useEffect, useState, useCallback } from 'react';
import { Mail, CheckCircle, XCircle, Search, RefreshCw, Users, Calendar, BarChart3 } from 'lucide-react';

type SubView = 'overview' | 'daily' | 'user-lookup';

interface CohortSummary {
  sent: number;
  failed: number;
  lastSent: string | null;
}

interface SummaryData {
  cohorts: Record<string, CohortSummary>;
  uniqueUsersEmailed: number;
  totalEmails: number;
}

interface DailyRow {
  _id: { date: string; cohort: string; status: string };
  count: number;
}

interface EmailLogEntry {
  _id: string;
  userId: string;
  cohort: string;
  sentAt: string;
  status: 'sent' | 'failed';
  error?: string;
  messageId?: string;
}

const COHORT_LABELS: Record<string, string> = {
  ghost_signup: 'Ghost Signups',
  stuck_starter: 'Stuck Starters',
  almost_activated: 'Almost Activated',
  going_idle: 'Going Idle',
  win_back: 'Win-back',
  paid_feedback: 'Paid Feedback',
};

const COHORT_DESCRIPTIONS: Record<string, string> = {
  ghost_signup: '2-3 days old, no projects',
  stuck_starter: '3-5 days old, <100 words',
  almost_activated: '5-10 days old, has AI usage',
  going_idle: '7-14 days inactive',
  win_back: '30+ days inactive',
  paid_feedback: 'Paid, subscribed 7-14 days ago',
};

export default function EngagementEmailsTab() {
  const [activeView, setActiveView] = useState<SubView>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  // Overview data
  const [summary, setSummary] = useState<SummaryData | null>(null);

  // Daily data
  const [dailyData, setDailyData] = useState<DailyRow[]>([]);

  // User lookup
  const [userSearch, setUserSearch] = useState('');
  const [userLogs, setUserLogs] = useState<EmailLogEntry[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/engagement-emails?view=summary&days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch summary');
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  const fetchDaily = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/engagement-emails?view=daily&days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch daily data');
      const data = await res.json();
      setDailyData(data.daily || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  const searchUser = useCallback(async () => {
    if (!userSearch.trim()) return;
    setUserSearchLoading(true);
    try {
      const res = await fetch(`/api/admin/engagement-emails?view=user&email=${encodeURIComponent(userSearch.trim())}`);
      if (!res.ok) throw new Error('Failed to fetch user data');
      const data = await res.json();
      setUserLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search user');
    } finally {
      setUserSearchLoading(false);
    }
  }, [userSearch]);

  useEffect(() => {
    if (activeView === 'overview') fetchSummary();
    else if (activeView === 'daily') fetchDaily();
  }, [activeView, fetchSummary, fetchDaily]);

  const allCohorts = ['ghost_signup', 'stuck_starter', 'almost_activated', 'going_idle', 'win_back', 'paid_feedback'];
  const totalSent = summary ? allCohorts.reduce((s, c) => s + (summary.cohorts[c]?.sent || 0), 0) : 0;
  const totalFailed = summary ? allCohorts.reduce((s, c) => s + (summary.cohorts[c]?.failed || 0), 0) : 0;

  // Group daily data by date
  const dailyByDate = dailyData.reduce<Record<string, Record<string, { sent: number; failed: number }>>>((acc, row) => {
    const date = row._id.date;
    const cohort = row._id.cohort;
    if (!acc[date]) acc[date] = {};
    if (!acc[date][cohort]) acc[date][cohort] = { sent: 0, failed: 0 };
    if (row._id.status === 'sent') acc[date][cohort].sent = row.count;
    else acc[date][cohort].failed = row.count;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Sub-view Navigation */}
      <div className="flex items-center gap-2 border-b-2 border-[hsl(var(--border-strong))]">
        <button
          onClick={() => setActiveView('overview')}
          className={`px-3 sm:px-6 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap touch-manipulation ${
            activeView === 'overview'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          <BarChart3 size={14} className="sm:w-4 sm:h-4" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveView('daily')}
          className={`px-3 sm:px-6 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap touch-manipulation ${
            activeView === 'daily'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          <Calendar size={14} className="sm:w-4 sm:h-4" />
          <span>Daily Activity</span>
        </button>
        <button
          onClick={() => setActiveView('user-lookup')}
          className={`px-3 sm:px-6 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap touch-manipulation ${
            activeView === 'user-lookup'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          <Search size={14} className="sm:w-4 sm:h-4" />
          <span>User Lookup</span>
        </button>
      </div>

      {/* Period Filter */}
      {activeView !== 'user-lookup' && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Period:</span>
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] font-semibold border-2 border-[hsl(var(--border-strong))] rounded-(--radius) transition-colors cursor-pointer ${
                days === d
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-muted))]'
              }`}
            >
              {d}d
            </button>
          ))}
          <button
            onClick={() => setDays(0)}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] font-semibold border-2 border-[hsl(var(--border-strong))] rounded-(--radius) transition-colors cursor-pointer ${
              days === 0
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-muted))]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => activeView === 'overview' ? fetchSummary() : fetchDaily()}
            className="ml-auto p-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) hover:bg-[hsl(var(--surface-muted))] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      )}

      {error && (
        <div className="border-2 border-red-300 bg-red-50 text-red-800 p-3 rounded-(--radius) text-xs">
          {error}
        </div>
      )}

      {/* ============ Overview View ============ */}
      {activeView === 'overview' && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={24} className="animate-spin text-[hsl(var(--muted-foreground))]" />
            </div>
          ) : summary ? (
            <>
              {/* Summary Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail size={16} className="text-[hsl(var(--primary))]" />
                    <span className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Total Sent</span>
                  </div>
                  <span className="text-2xl font-bold">{totalSent}</span>
                </div>
                <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-[hsl(var(--secondary))]" />
                    <span className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Unique Users</span>
                  </div>
                  <span className="text-2xl font-bold">{summary.uniqueUsersEmailed}</span>
                </div>
                <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle size={16} className="text-red-500" />
                    <span className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Failed</span>
                  </div>
                  <span className="text-2xl font-bold">{totalFailed}</span>
                </div>
              </div>

              {/* Cohort Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {allCohorts.map((cohort) => {
                  const data = summary.cohorts[cohort];
                  return (
                    <div key={cohort} className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-[0.16em]">
                        {COHORT_LABELS[cohort]}
                      </h4>
                      <p className="text-[9px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                        {COHORT_DESCRIPTIONS[cohort]}
                      </p>
                      {data ? (
                        <>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={12} className="text-green-600" />
                            <span className="text-sm font-bold">{data.sent}</span>
                            <span className="text-[9px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">sent</span>
                          </div>
                          {data.failed > 0 && (
                            <div className="flex items-center gap-2">
                              <XCircle size={12} className="text-red-500" />
                              <span className="text-sm font-bold">{data.failed}</span>
                              <span className="text-[9px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">failed</span>
                            </div>
                          )}
                          {data.lastSent && (
                            <p className="text-[9px] text-[hsl(var(--muted-foreground))]">
                              Last: {new Date(data.lastSent).toLocaleDateString()}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">No emails sent yet</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </>
      )}

      {/* ============ Daily Activity View ============ */}
      {activeView === 'daily' && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={24} className="animate-spin text-[hsl(var(--muted-foreground))]" />
            </div>
          ) : (
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[hsl(var(--border-strong))]">
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.24em] font-semibold text-[hsl(var(--muted-foreground))]">Date</th>
                    {allCohorts.map((c) => (
                      <th key={c} className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.24em] font-semibold text-[hsl(var(--muted-foreground))]">
                        {COHORT_LABELS[c]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(dailyByDate).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
                        No data for this period
                      </td>
                    </tr>
                  ) : (
                    Object.entries(dailyByDate)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([date, cohorts]) => (
                        <tr key={date} className="border-b border-[hsl(var(--border))]">
                          <td className="px-4 py-3 text-xs font-mono">{date}</td>
                          {allCohorts.map((c) => {
                            const cell = cohorts[c];
                            return (
                              <td key={c} className="px-4 py-3 text-center text-xs">
                                {cell ? (
                                  <span>
                                    <span className="text-green-600 font-semibold">{cell.sent}</span>
                                    {cell.failed > 0 && (
                                      <span className="text-red-500 ml-1">/ {cell.failed}</span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-[hsl(var(--muted-foreground))]">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ============ User Lookup View ============ */}
      {activeView === 'user-lookup' && (
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={16} />
              <input
                type="email"
                placeholder="Search by email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                className="w-full pl-10 pr-4 py-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-xs uppercase tracking-[0.24em] rounded-(--radius) focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2"
              />
            </div>
            <button
              onClick={searchUser}
              disabled={userSearchLoading || !userSearch.trim()}
              className="px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) text-xs font-semibold uppercase tracking-[0.24em] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] disabled:opacity-50 cursor-pointer"
            >
              {userSearchLoading ? <RefreshCw size={14} className="animate-spin" /> : 'Search'}
            </button>
          </div>

          {userLogs.length > 0 ? (
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[hsl(var(--border-strong))]">
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.24em] font-semibold text-[hsl(var(--muted-foreground))]">Cohort</th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.24em] font-semibold text-[hsl(var(--muted-foreground))]">Sent At</th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.24em] font-semibold text-[hsl(var(--muted-foreground))]">Status</th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.24em] font-semibold text-[hsl(var(--muted-foreground))]">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {userLogs.map((log) => (
                    <tr key={log._id} className="border-b border-[hsl(var(--border))]">
                      <td className="px-4 py-3 text-xs font-semibold">
                        {COHORT_LABELS[log.cohort] || log.cohort}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">
                        {new Date(log.sentAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {log.status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-green-600">
                            <CheckCircle size={12} /> Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-red-500">
                            <XCircle size={12} /> Failed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))] max-w-xs truncate">
                        {log.error || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : userSearch.trim() && !userSearchLoading ? (
            <div className="text-center py-8 text-xs text-[hsl(var(--muted-foreground))]">
              No engagement emails found for this user
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
