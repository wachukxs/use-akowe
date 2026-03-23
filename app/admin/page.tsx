'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertCircle, 
  FileText, 
  Activity,
  CheckCircle,
  XCircle,
  Calendar,
  Search,
  Zap,
  ChevronDown,
  ChevronUp,
  Target,
  BarChart3,
  Sparkles,
  UserCheck,
  Repeat,
  Info,
  Award,
  Shield,
  RefreshCw,
  Link as LinkIcon,
  Mail,
  MessageSquare,
  Share2,
} from 'lucide-react';
import ReferralsTab from '@/components/admin/ReferralsTab';
import MarketingTab from '@/components/admin/MarketingTab';
import AnalyticsTab from '@/components/admin/AnalyticsTab';
import EngagementEmailsTab from '@/components/admin/EngagementEmailsTab';
import ActivationFunnelTab from '@/components/admin/ActivationFunnelTab';
import TimeSeriesChart from '@/components/admin/TimeSeriesChart';

type AdminTab = 'dashboard' | 'marketing' | 'referrals' | 'analytics' | 'engagement' | 'funnel' | 'support';

// Updated interface to match new structure
interface AdminMetricsResponse {
  executiveSummary: {
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    activeSubscriptions: number;
    wau: number;
    wauChange: number;
  };
  periodPerformance: {
    users: {
      newInPeriod: number;
      newLast7Days: number;
      growth: Array<{ _id: string; count: number }>;
    };
    projects: {
      createdInPeriod: number;
      growth: Array<{ _id: string; count: number }>;
    };
    usage: {
      aiWordsInPeriod: number;
      plagiarismChecksInPeriod: number;
      topicFinderSearchesInPeriod: number;
      paraphraseUsesInPeriod: number;
      litReviewAnalysesInPeriod: number;
      growth: Array<{ _id: string; count: number }>;
      topUsersByUsage: Array<{
        userId: string;
        email: string;
        name: string;
        plan: string;
        totalAIWords: number;
        totalPlagiarismChecks: number;
        totalTopicFinderSearches: number;
        totalParaphraseUses: number;
        totalLitReviewAnalyses: number;
        totalCitations: number;
        projectsWithCitations: number;
      }>;
    };
    revenue: {
      revenueInPeriod: number;
      revenueLast7Days: number;
      growth: Array<{ _id: string; count: number }>;
    };
    engagement: {
      activeUsers: number;
      avgActiveDays: number;
      powerUsers: number;
      consistentUsers: number;
    };
  };
  businessMetrics: {
    revenue: {
      totalRevenue: number;
      monthlyRecurringRevenue: number;
      annualRecurringRevenue: number;
      activeSubscriptions: number;
      paymentFailures: number;
      pastDueSubscriptions: number;
      canceledSubscriptions: number;
    };
    users: {
      total: number;
      free: number;
      standard: number;
      pro: number;
      team: number;
      withSubscriptions: number;
      conversionRate: number;
    };
    monetization: {
      arpu: number;
      arpuActive: number;
      avgTimeToConversion: number;
    };
  };
  coreMetrics: {
    wau: number;
    wauChange: number;
    mau: number;
    activationRate: number;
    activationTotal: number;
    activationActivated: number;
    avgTimeToActivation: number | null;
    week1Retention: number;
    week1CohortSize: number;
    week4Retention: number;
    week4CohortSize: number;
    projectsCompleted: number;
    projectsCompletedChange: number;
    wordsPerActiveDay: number;
    wowRetention: number;
  };
  productHealth: {
    completionRate: number;
    behavioralCompletionRate: number;
    avgProjectsPerUser: number;
    usersWithMultipleProjects: number;
    citationAdoption: number;
    pdfAdoption: number;
    plagiarismAdoption: number;
    litReviewAdoption: number;
    projects: {
      total: number;
      active: number;
      completed: number;
      behaviorallyCompleted: number;
    };
  };
  reviewMetrics: {
    totalShareLinks: number;
    activeShareLinks: number;
    totalComments: number;
    resolvedComments: number;
    resolutionRate: number;
    projectsWithShares: number;
  };
  retention: {
    churnRate: number;
    churnedUsers: number;
    week1Retention: number;
    week1CohortSize: number;
    week4Retention: number;
    week4CohortSize: number;
    wowRetention: number;
  };
  detailedLists: {
    recentUsers: Array<{
      _id: string;
      name: string;
      email: string;
      plan: string;
      createdAt: string;
      stripeSubscriptionId?: string;
      totalAIWords?: number;
      totalPlagiarismChecks?: number;
      totalTopicFinderSearches?: number;
      totalParaphraseUses?: number;
      totalLitReviewAnalyses?: number;
      totalCitations?: number;
      projectsWithCitations?: number;
      activeDays?: number;
    }>;
    topUsersByUsage: Array<{
      userId: string;
      email: string;
      name: string;
      plan: string;
      totalAIWords: number;
      totalPlagiarismChecks: number;
      totalTopicFinderSearches: number;
      totalLitReviewAnalyses: number;
      totalCitations: number;
      projectsWithCitations: number;
    }>;
    subscriptionDetails: Array<{
      id: string;
      status: string;
      customerEmail: string;
      amount: number;
      interval: string;
      createdAt: number;
      currentPeriodEnd: number;
    }>;
  };
  comparisons: {
    previousPeriod: {
      newUsers: number;
      projectsCreated: number;
      aiWords: number;
      plagiarismChecks: number;
      topicFinderSearches: number;
      litReviewAnalyses: number;
      revenue: number;
    };
    changes: {
      newUsers: number;
      projectsCreated: number;
      aiWords: number;
      plagiarismChecks: number;
      topicFinderSearches: number;
      litReviewAnalyses: number;
      revenue: number;
    };
  };
  dateRange: {
    days: number;
    start: string;
    end: string;
  };
  timeContexts: {
    executiveSummary: 'current';
    periodPerformance: 'period';
    businessMetrics: 'mixed';
    coreMetrics: 'fixed-window';
    productHealth: 'all-time';
    retention: 'fixed-window';
  };
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  mongodb: {
    connected: boolean;
    state: string;
    connectionTime?: string;
    database?: string;
    collections?: number;
    error?: string;
    isConnectionError?: boolean;
  };
  timestamp: string;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  benchmark?: { value: number; label: string };
  goal?: { current: number; target: number; label: string };
  explanation?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  timeContext?: 'current' | 'period' | 'all-time' | 'adaptive' | 'fixed-window' | 'mixed';
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: number | string;
  timeContext?: 'current' | 'period' | 'all-time' | 'adaptive' | 'fixed-window' | 'mixed';
  description?: string;
}

// Industry standard benchmarks
const BENCHMARKS = {
  conversionRate: { excellent: 5, good: 3, average: 1.5 },
  churnRate: { excellent: 3, good: 5, average: 10 },
  stickiness: { excellent: 40, good: 25, average: 15 },
  completionRate: { excellent: 60, good: 40, average: 25 },
  arpu: { excellent: 50, good: 30, average: 15 },
  timeToConversion: { excellent: 7, good: 14, average: 30 },
  featureAdoption: { excellent: 50, good: 30, average: 15 },
};

function TimeContextBadge({ context }: { context: string }) {
  const badges = {
    current: { label: 'Current', color: 'bg-blue-500/20 text-blue-500' },
    period: { label: 'Period', color: 'bg-green-500/20 text-green-500' },
    'all-time': { label: 'All Time', color: 'bg-gray-500/20 text-gray-500' },
    adaptive: { label: 'Adaptive', color: 'bg-purple-500/20 text-purple-500' },
    'fixed-window': { label: 'Fixed Window', color: 'bg-orange-500/20 text-orange-500' },
    mixed: { label: 'Mixed', color: 'bg-yellow-500/20 text-yellow-500' },
  };

  const badge = badges[context as keyof typeof badges] || badges.mixed;

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${badge.color}`}>
      {badge.label}
    </span>
  );
}

function MetricCard({ 
  label, 
  value, 
  subtitle, 
  trend, 
  benchmark, 
  goal, 
  explanation, 
  icon,
  highlight = false,
  timeContext
}: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const getTrendColor = (trendValue: number | undefined) => {
    if (trendValue === undefined || Number.isNaN(trendValue)) {
      return 'text-[hsl(var(--muted-foreground))]';
    }
    if (trendValue > 0) return 'text-green-500';
    if (trendValue < 0) return 'text-red-500';
    return 'text-[hsl(var(--muted-foreground))]';
  };
  
  return (
    <div className={`border-2 border-[hsl(var(--border-strong))] ${highlight ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--surface))]'} p-4 rounded-lg relative`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          {icon && <span className={highlight ? 'text-[hsl(var(--accent-foreground))]' : ''}>{icon}</span>}
          <span className={`text-xs uppercase tracking-[0.32em] ${highlight ? 'text-[hsl(var(--accent-foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
            {label}
          </span>
          {timeContext && <TimeContextBadge context={timeContext} />}
          {explanation && (
            <div className="relative">
              <Info
                size={14}
                className="text-[hsl(var(--muted-foreground))] cursor-help shrink-0"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(prev => !prev)}
              />
              {showTooltip && (
                <>
                  <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setShowTooltip(false)} />
                  <div className="fixed bottom-4 left-4 right-4 z-50 p-4 sm:absolute sm:bottom-full sm:left-auto sm:right-0 sm:top-auto sm:w-64 sm:p-3 mb-0 sm:mb-2 bg-[hsl(var(--popover))] border-2 border-[hsl(var(--border-strong))] rounded-lg text-xs text-left shadow-lg">
                    {explanation}
                    <button onClick={() => setShowTooltip(false)} className="mt-2 text-[hsl(var(--primary))] font-semibold uppercase tracking-widest sm:hidden">Close</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {trend !== undefined && Number.isFinite(trend) && (
          <div className={`flex items-center gap-1 ${getTrendColor(trend)}`}>
            {trend > 0 ? <TrendingUp size={14} /> : trend < 0 ? <TrendingDown size={14} /> : null}
            {Number.isFinite(trend) && (
              <span className="text-xs font-semibold">
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className={`text-2xl font-bold ${highlight ? 'text-[hsl(var(--accent-foreground))]' : ''}`}>
        {value}
      </div>
      
      {subtitle && (
        <div className={`text-xs ${highlight ? 'text-[hsl(var(--accent-foreground))] opacity-80' : 'text-[hsl(var(--muted-foreground))]'} mt-1`}>
          {subtitle}
        </div>
      )}
      
      {goal &&
        Number.isFinite(goal.current) &&
        Number.isFinite(goal.target) &&
        goal.target !== 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[hsl(var(--muted-foreground))]">{goal.label}</span>
            <span className="text-xs font-semibold">
              {goal.current} / {goal.target} ({Math.min((goal.current / goal.target) * 100, 100).toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-[hsl(var(--border-strong))] rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                (goal.current / goal.target) * 100 >= 100 ? 'bg-green-500' :
                (goal.current / goal.target) * 100 >= 75 ? 'bg-[hsl(var(--primary))]' :
                (goal.current / goal.target) * 100 >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
      
      {benchmark && (
        <div className="mt-2 flex items-center gap-2">
          <Award size={12} className="text-[hsl(var(--muted-foreground))]" />
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            Industry {benchmark.label}: {benchmark.value}
          </span>
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ title, icon, isExpanded, onToggle, children, badge, timeContext, description }: CollapsibleSectionProps) {
  return (
    <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--accent))]/10 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 flex-1">
          {icon}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold uppercase tracking-[0.16em]">{title}</h2>
              {timeContext && <TimeContextBadge context={timeContext} />}
              {badge !== undefined && (
                <span className="px-2 py-0.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs font-semibold">
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{description}</p>
            )}
          </div>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isExpanded && (
        <div className="p-4 border-t border-[hsl(var(--border-strong))]">
          {children}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Support Tab — usage reset tools
// ---------------------------------------------------------------------------
// ── Types for User Lookup ──────────────────────────────────────────────────
interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: string;
  billingCycle?: string;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  paymentGraceDeadline?: string | null;
  lastActiveAt?: string | null;
  createdAt?: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}
interface TodayUsage {
  date: string;
  aiWordsGenerated: number;
  plagiarismChecks: number;
  paraphraseUses: number;
  topicFinderSearches: number;
  litReviewAnalyses: number;
}
interface SuppressionInfo { suppressed: boolean; reason?: string; suppressedAt?: string; }
interface LookupResult {
  user: UserProfile;
  todayUsage: TodayUsage;
  projectCount: number;
  suppression: SuppressionInfo;
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  standard: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  team: 'bg-green-100 text-green-700',
};

function UserLookupPanel() {
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState('');

  async function handleLookup() {
    if (!searchEmail.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    setActionResult(null);
    try {
      const res = await fetch(`/api/admin/user-lookup?email=${encodeURIComponent(searchEmail.trim())}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setData(json);
      setNewPlan(json.user.plan);
    } catch {
      setError('Lookup failed. Check console.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetUsage(field: string) {
    if (!data) return;
    const label = field === 'all' ? 'ALL usage fields' : field;
    if (!confirm(`Reset ${label} for ${data.user.email} today?`)) return;
    setActionLoading(`reset_${field}`);
    setActionResult(null);
    try {
      const res = await fetch('/api/admin/reset-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.user.email, field }),
      });
      const json = await res.json();
      setActionResult({ success: json.success, message: json.message || json.error });
      if (json.success) {
        // Refresh the lookup to show updated counts
        const refreshed = await fetch(`/api/admin/user-lookup?email=${encodeURIComponent(data.user.email)}`);
        const refreshedJson = await refreshed.json();
        if (refreshed.ok) setData(refreshedJson);
      }
    } catch {
      setActionResult({ success: false, message: 'Action failed.' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleChangePlan() {
    if (!data || !newPlan || newPlan === data.user.plan) return;
    if (!confirm(`Change ${data.user.email} from ${data.user.plan} → ${newPlan}?`)) return;
    setActionLoading('change_plan');
    setActionResult(null);
    try {
      const res = await fetch('/api/admin/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.user.email, plan: newPlan }),
      });
      const json = await res.json();
      setActionResult({ success: json.success, message: json.message || json.error });
      if (json.success) setData((d) => d ? { ...d, user: { ...d.user, plan: newPlan } } : d);
    } catch {
      setActionResult({ success: false, message: 'Action failed.' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemoveSuppression() {
    if (!data) return;
    if (!confirm(`Remove ${data.user.email} from the email suppression list?`)) return;
    setActionLoading('suppression');
    setActionResult(null);
    try {
      const res = await fetch('/api/admin/email-suppression', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.user.email }),
      });
      const json = await res.json();
      setActionResult({ success: json.success, message: json.message || json.error });
      if (json.success) setData((d) => d ? { ...d, suppression: { suppressed: false } } : d);
    } catch {
      setActionResult({ success: false, message: 'Action failed.' });
    } finally {
      setActionLoading(null);
    }
  }

  function fmt(dateStr?: string | null) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <div className="border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Search size={16} />
        <h2 className="text-sm font-bold uppercase tracking-[0.2em]">User Lookup</h2>
      </div>
      <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.14em]">
        Search any user by email to view their account state and take action.
      </p>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="email"
          placeholder="user@example.com"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          className="flex-1 border-2 border-[hsl(var(--border-strong))] px-3 py-1.5 text-sm"
        />
        <button
          onClick={handleLookup}
          disabled={loading || !searchEmail.trim()}
          className="px-5 py-1.5 border-2 border-[hsl(var(--border-strong))] text-xs uppercase tracking-[0.16em] font-semibold hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Look Up'}
        </button>
      </div>

      {error && (
        <div className="p-3 border-2 border-red-400 bg-red-50 text-red-800 text-xs rounded">{error}</div>
      )}

      {actionResult && (
        <div className={`p-3 border-2 rounded text-xs font-medium ${actionResult.success ? 'border-green-500 bg-green-50 text-green-800' : 'border-red-400 bg-red-50 text-red-800'}`}>
          {actionResult.message}
        </div>
      )}

      {data && (
        <div className="space-y-5">
          {/* Profile */}
          <div className="border-2 border-[hsl(var(--border))] rounded p-4 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-bold text-sm">{data.user.name || '—'}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{data.user.email}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${PLAN_COLORS[data.user.plan] ?? 'bg-gray-100 text-gray-700'}`}>
                {data.user.plan}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div><p className="uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))] mb-0.5">Joined</p><p className="font-medium">{fmt(data.user.createdAt)}</p></div>
              <div><p className="uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))] mb-0.5">Last Active</p><p className="font-medium">{fmt(data.user.lastActiveAt)}</p></div>
              <div><p className="uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))] mb-0.5">Projects</p><p className="font-semibold">{data.projectCount}</p></div>
              <div><p className="uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))] mb-0.5">Billing</p><p className="font-medium capitalize">{data.user.billingCycle || '—'}</p></div>
            </div>
            {data.user.paymentGraceDeadline && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded">
                ⚠ Payment grace deadline: {fmt(data.user.paymentGraceDeadline)}
              </p>
            )}
            {data.suppression.suppressed && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-300 px-3 py-1.5 rounded">
                ✕ Email suppressed — reason: {data.suppression.reason} since {fmt(data.suppression.suppressedAt)}
              </p>
            )}
          </div>

          {/* Today's usage */}
          <div className="border-2 border-[hsl(var(--border))] rounded p-4 space-y-2">
            <p className="text-xs uppercase tracking-[0.16em] font-semibold mb-3">Today&apos;s Usage ({data.todayUsage.date})</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              {[
                { label: 'AI Words', value: data.todayUsage.aiWordsGenerated },
                { label: 'Plagiarism', value: data.todayUsage.plagiarismChecks },
                { label: 'Paraphrase', value: data.todayUsage.paraphraseUses },
                { label: 'Topic Finder', value: data.todayUsage.topicFinderSearches },
                { label: 'Lit Review', value: data.todayUsage.litReviewAnalyses },
              ].map(({ label, value }) => (
                <div key={label} className="text-center bg-[hsl(var(--surface-muted))] rounded p-2">
                  <p className="text-lg font-bold">{value}</p>
                  <p className="text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em] text-[10px]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.16em] font-semibold">Actions</p>

            {/* Reset usage */}
            <div className="flex flex-wrap gap-2">
              {[
                { field: 'aiWordsGenerated', label: 'Reset AI Words' },
                { field: 'plagiarismChecks', label: 'Reset Plagiarism' },
                { field: 'paraphraseUses', label: 'Reset Paraphrase' },
                { field: 'all', label: 'Reset All Today' },
              ].map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => handleResetUsage(field)}
                  disabled={!!actionLoading}
                  className={`px-3 py-1.5 border-2 border-[hsl(var(--border-strong))] text-xs uppercase tracking-[0.14em] font-semibold hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform disabled:opacity-50 ${field === 'all' ? 'bg-amber-50 border-amber-400 text-amber-800' : ''}`}
                >
                  {actionLoading === `reset_${field}` ? 'Resetting…' : label}
                </button>
              ))}
            </div>

            {/* Change plan */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs uppercase tracking-[0.16em] font-semibold whitespace-nowrap">Change Plan</label>
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value)}
                className="border-2 border-[hsl(var(--border-strong))] px-2 py-1 text-sm"
              >
                {['free', 'standard', 'pro', 'team'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button
                onClick={handleChangePlan}
                disabled={!!actionLoading || newPlan === data.user.plan}
                className="px-4 py-1.5 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-xs uppercase tracking-[0.16em] font-semibold hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform disabled:opacity-50"
              >
                {actionLoading === 'change_plan' ? 'Saving…' : 'Apply'}
              </button>
            </div>

            {/* Email suppression */}
            {data.suppression.suppressed && (
              <button
                onClick={handleRemoveSuppression}
                disabled={!!actionLoading}
                className="px-4 py-1.5 border-2 border-[hsl(var(--border-strong))] text-xs uppercase tracking-[0.16em] font-semibold hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform disabled:opacity-50"
              >
                {actionLoading === 'suppression' ? 'Removing…' : 'Remove Email Suppression'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SendPlagiarismFixPanel() {
  const [days, setDays] = useState(3);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ uniqueUsers: number; users: Array<{ email: string; name: string; plan: string }> } | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function fetchEmailPreview() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/send-plagiarism-fix?days=${days}`);
      const data = await res.json();
      setPreview(data);
    } catch {
      setResult({ success: false, message: 'Failed to load preview.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSendEmails() {
    if (!confirm(`Send plagiarism fix email to ${preview?.uniqueUsers ?? '?'} user(s)? Each will receive one email.`)) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/send-plagiarism-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });
      const data = await res.json();
      setResult({ success: data.success, message: data.message || data.error });
      setPreview(null);
    } catch {
      setResult({ success: false, message: 'Send failed. Check console.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Mail size={16} />
        <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Send Plagiarism Fix Email</h2>
      </div>
      <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.14em]">
        Sends a personal email from Olamide to users who had plagiarism activity in the last N days, letting them know the bug is fixed and their count has been reset.
      </p>

      {result && (
        <div className={`p-3 border-2 rounded text-xs font-medium ${result.success ? 'border-green-500 bg-green-50 text-green-800' : 'border-red-500 bg-red-50 text-red-800'}`}>
          {result.message}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-xs uppercase tracking-[0.18em] font-semibold whitespace-nowrap">Window (days)</label>
        <input
          type="number"
          min={1}
          max={30}
          value={days}
          onChange={(e) => { setDays(Number(e.target.value)); setPreview(null); }}
          className="w-20 border-2 border-[hsl(var(--border-strong))] px-2 py-1 text-sm"
        />
        <button
          onClick={fetchEmailPreview}
          disabled={loading}
          className="px-4 py-1.5 border-2 border-[hsl(var(--border-strong))] text-xs uppercase tracking-[0.16em] font-semibold hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform disabled:opacity-50"
        >
          {loading && !preview ? 'Loading…' : 'Preview Recipients'}
        </button>
        {preview && (
          <button
            onClick={handleSendEmails}
            disabled={loading || preview.uniqueUsers === 0}
            className="px-4 py-1.5 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-xs uppercase tracking-[0.16em] font-semibold hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform disabled:opacity-50"
          >
            {loading ? 'Sending…' : `Send to ${preview.uniqueUsers} User(s)`}
          </button>
        )}
      </div>

      {preview && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] font-semibold">{preview.uniqueUsers} recipient(s)</p>
          {preview.users.length > 0 && (
            <div className="border-2 border-[hsl(var(--border))] rounded overflow-auto max-h-48">
              <table className="w-full text-xs">
                <thead className="bg-[hsl(var(--surface-muted))] uppercase tracking-[0.14em]">
                  <tr>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.users.map((u, i) => (
                    <tr key={i} className="border-t border-[hsl(var(--border))]">
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">{u.name || '—'}</td>
                      <td className="p-2 uppercase">{u.plan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SupportTab({ TabNavigation }: { TabNavigation: () => React.JSX.Element }) {
  const [bulkDays, setBulkDays] = useState(3);
  const [userEmail, setUserEmail] = useState('');
  const [preview, setPreview] = useState<{ uniqueUsers: number; totalDocs: number; breakdown: Array<{ email: string; plan: string; date: string; plagiarismChecks: number }> } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingReset, setLoadingReset] = useState<'bulk' | 'user' | null>(null);
  const [result, setResult] = useState<{ message: string; success: boolean } | null>(null);

  async function fetchPreview() {
    setLoadingPreview(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/reset-plagiarism?days=${bulkDays}`);
      const data = await res.json();
      setPreview(data);
    } catch {
      setResult({ success: false, message: 'Failed to load preview.' });
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleBulkReset() {
    if (!confirm(`Reset plagiarism checks for ALL users in the last ${bulkDays} day(s)? This cannot be undone.`)) return;
    setLoadingReset('bulk');
    setResult(null);
    try {
      const res = await fetch('/api/admin/reset-plagiarism', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'bulk', days: bulkDays }),
      });
      const data = await res.json();
      setResult({ success: data.success, message: data.message || data.error });
      setPreview(null);
    } catch {
      setResult({ success: false, message: 'Reset failed. Check console.' });
    } finally {
      setLoadingReset(null);
    }
  }

  async function handleUserReset() {
    if (!userEmail.trim()) return;
    if (!confirm(`Reset ALL plagiarism check counts for ${userEmail}?`)) return;
    setLoadingReset('user');
    setResult(null);
    try {
      const res = await fetch('/api/admin/reset-plagiarism', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'user', email: userEmail.trim() }),
      });
      const data = await res.json();
      setResult({ success: data.success, message: data.message || data.error });
    } catch {
      setResult({ success: false, message: 'Reset failed. Check console.' });
    } finally {
      setLoadingReset(null);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-3 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="pb-4 border-b-2 border-[hsl(var(--border-strong))]">
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.16em] mb-1">Admin Dashboard</h1>
          <p className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Support Tools</p>
        </div>

        <TabNavigation />

        <UserLookupPanel />

        {/* ── Section divider: Bulk Tools ── */}
        <div className="pt-2 border-t-2 border-[hsl(var(--border))]">
          <p className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] mb-6">Bulk Tools</p>
        </div>

        {/* Result banner for bulk/user reset actions */}
        {result && (
          <div className={`-mt-2 p-4 border-2 rounded text-sm font-medium ${result.success ? 'border-green-500 bg-green-50 text-green-800' : 'border-red-500 bg-red-50 text-red-800'}`}>
            {result.message}
          </div>
        )}

        {/* ── Bulk reset ── */}
        <div className="border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded p-6 space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} />
            <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Bulk Reset — Last N Days</h2>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.14em]">
            Zeroes out plagiarism check counts for every user who has usage records in the selected window.
          </p>

          <div className="flex items-center gap-3">
            <label className="text-xs uppercase tracking-[0.18em] font-semibold whitespace-nowrap">Window (days)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={bulkDays}
              onChange={(e) => { setBulkDays(Number(e.target.value)); setPreview(null); }}
              className="w-20 border-2 border-[hsl(var(--border-strong))] px-2 py-1 text-sm"
            />
            <button
              onClick={fetchPreview}
              disabled={loadingPreview}
              className="px-4 py-1.5 border-2 border-[hsl(var(--border-strong))] text-xs uppercase tracking-[0.16em] font-semibold hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform disabled:opacity-50"
            >
              {loadingPreview ? 'Loading…' : 'Preview'}
            </button>
            <button
              onClick={handleBulkReset}
              disabled={!!loadingReset}
              className="px-4 py-1.5 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] text-xs uppercase tracking-[0.16em] font-semibold hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform disabled:opacity-50"
            >
              {loadingReset === 'bulk' ? 'Resetting…' : 'Reset All'}
            </button>
          </div>

          {preview && (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.16em] font-semibold">
                Preview — {preview.uniqueUsers} user(s), {preview.totalDocs} day record(s) affected
              </p>
              {preview.breakdown.length > 0 && (
                <div className="border-2 border-[hsl(var(--border))] rounded overflow-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead className="bg-[hsl(var(--surface-muted))] uppercase tracking-[0.14em]">
                      <tr>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Plan</th>
                        <th className="text-left p-2">Date</th>
                        <th className="text-right p-2">Checks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.breakdown.map((row, i) => (
                        <tr key={i} className="border-t border-[hsl(var(--border))]">
                          <td className="p-2">{row.email}</td>
                          <td className="p-2 uppercase">{row.plan}</td>
                          <td className="p-2">{row.date}</td>
                          <td className="p-2 text-right font-semibold">{row.plagiarismChecks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Single user reset ── */}
        <div className="border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded p-6 space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck size={16} />
            <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Reset Plagiarism — All History</h2>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.14em]">
            Clears plagiarism check counts across <strong>all dates</strong> for one user — not just today.
            Use this when a user has accumulated counts from multiple days that need a full wipe.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="email"
              placeholder="user@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="flex-1 min-w-48 border-2 border-[hsl(var(--border-strong))] px-3 py-1.5 text-sm"
            />
            <button
              onClick={handleUserReset}
              disabled={!!loadingReset || !userEmail.trim()}
              className="px-4 py-1.5 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] text-xs uppercase tracking-[0.16em] font-semibold hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform disabled:opacity-50"
            >
              {loadingReset === 'user' ? 'Resetting…' : 'Reset User'}
            </button>
          </div>
        </div>

        {/* ── Section divider: Broadcast Emails ── */}
        <div className="pt-2 border-t-2 border-[hsl(var(--border))]">
          <p className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] mb-6">Broadcast Emails</p>
        </div>

        {/* ── Send plagiarism fix email ── */}
        <SendPlagiarismFixPanel />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [metrics, setMetrics] = useState<AdminMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [daysFilter, setDaysFilter] = useState<number>(30);
  const [debouncedDaysFilter, setDebouncedDaysFilter] = useState<number>(30);
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string } | null>(null);
  const [debouncedCustomDateRange, setDebouncedCustomDateRange] = useState<{ start: string; end: string } | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [searchAbortController, setSearchAbortController] = useState<AbortController | null>(null);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [topUsersUsage, setTopUsersUsage] = useState<
    Array<{
      userId: string;
      email: string;
      name: string;
      plan: string;
      totalAIWords: number;
      totalPlagiarismChecks: number;
      totalTopicFinderSearches: number;
      totalLitReviewAnalyses: number;
      totalCitations: number;
      projectsWithCitations: number;
      activeDays: number;
    }> | null
  >(null);
  const [recentUsersPage, setRecentUsersPage] = useState(1);
  const recentUsersPageRef = useRef(1); // Ref to track current page for interval callback
  const recentUsersRequestIdRef = useRef(0); // Ref to track latest recent-users request for race condition prevention
  const [recentUsersPageSize] = useState(20);
  const [recentUsers, setRecentUsers] = useState<
    Array<{
      _id: string;
      name: string;
      email: string;
      plan: string;
      createdAt: string;
      stripeSubscriptionId?: string;
      totalAIWords: number;
      totalPlagiarismChecks: number;
      totalTopicFinderSearches: number;
      totalLitReviewAnalyses: number;
      totalCitations: number;
      projectsWithCitations: number;
      activeDays: number;
    }>
  >([]);
  const [recentUsersTotal, setRecentUsersTotal] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    executiveSummary: true,
    periodPerformance: true,
    businessMetrics: true,
    coreMetrics: true,
    productHealth: false,
    advisorReviews: false,
    retention: false,
    detailedLists: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounce date filter changes (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDaysFilter(daysFilter);
      setDebouncedCustomDateRange(customDateRange);
    }, 300);
    return () => clearTimeout(timer);
  }, [daysFilter, customDateRange]);

  // Fetch metrics and lists when date filters change (NOT when search changes)
  useEffect(() => {
    // Cancel previous request if still in flight
    if (abortController) {
      abortController.abort();
    }

    const controller = new AbortController();
    setAbortController(controller);

    fetchHealthStatus();
    fetchMetrics(controller.signal);
    fetchTopUsersUsage(controller.signal);
    fetchRecentUsers(1, controller.signal);
    
    const interval = setInterval(() => {
      fetchHealthStatus();
      const newController = new AbortController();
      setAbortController(newController);
      fetchMetrics(newController.signal);
      fetchTopUsersUsage(newController.signal);
      fetchRecentUsers(recentUsersPageRef.current, newController.signal);
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDaysFilter, debouncedCustomDateRange]);

  // Separate effect for search - only updates user lists, not metrics
  useEffect(() => {
    // Skip on initial mount (metrics effect handles initial load)
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }

    // Cancel previous search requests
    if (searchAbortController) {
      searchAbortController.abort();
    }

    const controller = new AbortController();
    setSearchAbortController(controller);

    setIsSearching(true);

    // Reset to page 1 when search changes
    setRecentUsersPage(1);
    recentUsersPageRef.current = 1;

    // Only fetch user lists, not metrics (search doesn't affect metrics)
    Promise.all([
      fetchTopUsersUsage(controller.signal),
      fetchRecentUsers(1, controller.signal),
    ]).finally(() => {
      if (!controller.signal.aborted) {
        setIsSearching(false);
      }
    });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/admin/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch (err) {
      console.error('Failed to fetch health status:', err);
    }
  };

  const fetchMetrics = async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setError(null);
      let url = `/api/admin/metrics?days=${debouncedDaysFilter}`;
      if (debouncedCustomDateRange) {
        url += `&start=${debouncedCustomDateRange.start}&end=${debouncedCustomDateRange.end}`;
      }
      const response = await fetch(url, { signal });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to fetch metrics');
      }
      const data = await response.json();
      if (!signal?.aborted) {
        setMetrics(data);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  const fetchTopUsersUsage = async (signal?: AbortSignal) => {
    try {
      let apiUrl = `/api/admin/metrics/usage-per-user?days=${debouncedDaysFilter}`;
      if (debouncedCustomDateRange) {
        apiUrl += `&start=${debouncedCustomDateRange.start}&end=${debouncedCustomDateRange.end}`;
      }
      if (debouncedSearch && debouncedSearch.trim().length > 0) {
        apiUrl += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
      }

      const response = await fetch(apiUrl, { signal });
      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      const data = await response.json();
      if (!signal?.aborted) {
        if (Array.isArray(data.users)) {
          setTopUsersUsage(data.users);
        } else {
          setTopUsersUsage(null);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      console.error('Failed to fetch top users usage:', err);
      if (!signal?.aborted) {
        setTopUsersUsage(null);
      }
    }
  };

  const fetchRecentUsers = async (page: number, signal?: AbortSignal) => {
    // Generate a unique request id for this invocation to prevent race conditions
    const requestId = ++recentUsersRequestIdRef.current;

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', recentUsersPageSize.toString());
      params.set('days', debouncedDaysFilter.toString());
      if (debouncedCustomDateRange) {
        params.set('start', debouncedCustomDateRange.start);
        params.set('end', debouncedCustomDateRange.end);
      }
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }

      const response = await fetch(`/api/admin/users/recent?${params.toString()}`, { signal });
      if (!response.ok) {
        throw new Error('Failed to fetch recent users');
      }

      const data = await response.json();
      if (!signal?.aborted) {
        // Only update state if this response matches the latest request id
        // This prevents stale responses from overwriting newer data
        if (recentUsersRequestIdRef.current === requestId) {
          if (Array.isArray(data.users)) {
            setRecentUsers(data.users);
            setRecentUsersTotal(data.total || data.users.length);
            const newPage = data.page || page;
            setRecentUsersPage(newPage);
            recentUsersPageRef.current = newPage; // Update ref to track current page
          }
        }
        // If ids don't match, a newer request has been made, ignore this stale response
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      console.error('Failed to fetch recent users:', err);
      // Fall back to metrics-based recent users if API fails
      // Only do this if this response matches the latest request id
      if (!signal?.aborted && recentUsersRequestIdRef.current === requestId && metrics?.detailedLists?.recentUsers) {
        const fallbackUsers = metrics.detailedLists.recentUsers.map(user => ({
          _id: user._id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          createdAt: user.createdAt,
          stripeSubscriptionId: user.stripeSubscriptionId,
          totalAIWords: user.totalAIWords || 0,
          totalPlagiarismChecks: user.totalPlagiarismChecks || 0,
          totalTopicFinderSearches: user.totalTopicFinderSearches || 0,
          totalLitReviewAnalyses: user.totalLitReviewAnalyses || 0,
          totalParaphraseUses: user.totalParaphraseUses || 0,
          totalCitations: user.totalCitations ?? 0,
          projectsWithCitations: user.projectsWithCitations ?? 0,
          activeDays: user.activeDays || 0,
        }));

        setRecentUsers(fallbackUsers);
        setRecentUsersTotal(fallbackUsers.length);
        // Fallback data represents a simple, non-paginated list; ensure UI reflects page 1
        setRecentUsersPage(1);
        recentUsersPageRef.current = 1;
      }
    }
  };

  const exportUsersToCSV = (users: Array<{ userId?: string; _id?: string; email?: string; name?: string; plan?: string; totalAIWords?: number; totalPlagiarismChecks?: number; totalTopicFinderSearches?: number; totalLitReviewAnalyses?: number; totalCitations?: number; projectsWithCitations?: number; activeDays?: number; createdAt?: string | Date; stripeSubscriptionId?: string }>) => {
    const headers = ['Name', 'Email', 'Plan', 'AI Words', 'Plagiarism Checks', 'Topic Finder Searches', 'Lit Review Analyses', 'Citations', 'Projects with Citations', 'Created At', 'Has Subscription'];
    const rows = users.map(user => [
      user.name || 'N/A',
      user.email || 'N/A',
      user.plan || 'free',
      user.totalAIWords?.toString() || '0',
      user.totalPlagiarismChecks?.toString() || '0',
      user.totalTopicFinderSearches?.toString() || '0',
      (user.totalLitReviewAnalyses || 0).toString(),
      user.totalCitations?.toString() || '0',
      user.projectsWithCitations?.toString() || '0',
      user.createdAt ? (typeof user.createdAt === 'string' ? new Date(user.createdAt) : user.createdAt).toLocaleDateString() : 'N/A',
      user.stripeSubscriptionId ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllUsersUsageToCSV = async () => {
    try {
      setIsLoading(true);
      let apiUrl = `/api/admin/metrics/usage-per-user?days=${debouncedDaysFilter}`;
      if (debouncedCustomDateRange) {
        apiUrl += `&start=${debouncedCustomDateRange.start}&end=${debouncedCustomDateRange.end}`;
      }
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }
      
      const data = await response.json();
      
      const headers = ['Name', 'Email', 'Plan', 'AI Words Generated', 'Plagiarism Checks', 'Topic Finder Searches', 'Lit Review Analyses', 'Citations', 'Projects with Citations', 'Active Days', 'User ID'];
      const rows = data.users.map((user: { name?: string; email?: string; plan?: string; totalAIWords?: number; totalPlagiarismChecks?: number; totalTopicFinderSearches?: number; totalLitReviewAnalyses?: number; totalCitations?: number; projectsWithCitations?: number; activeDays?: number; _id?: string; userId?: string }) => [
        user.name || 'N/A',
        user.email || 'N/A',
        user.plan || 'free',
        (user.totalAIWords || 0).toString(),
        (user.totalPlagiarismChecks || 0).toString(),
        (user.totalTopicFinderSearches || 0).toString(),
        (user.totalLitReviewAnalyses || 0).toString(),
        (user.totalCitations || 0).toString(),
        (user.projectsWithCitations || 0).toString(),
        (user.activeDays || 0).toString(),
        user._id || user.userId || 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: string[]) => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const blobUrl = URL.createObjectURL(blob);
      link.setAttribute('href', blobUrl);
      const dateRange = debouncedCustomDateRange 
        ? `${debouncedCustomDateRange.start}-${debouncedCustomDateRange.end}`
        : `last-${debouncedDaysFilter}-days`;
      link.setAttribute('download', `usage-per-user-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export usage data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomDateRange = (start: string, end: string) => {
    if (!start || !end) return;
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate > endDate) {
      setError('Start date must be before end date');
      return;
    }
    
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 1 || daysDiff > 365) {
      setError('Date range must be between 1 and 365 days');
      return;
    }
    
    setError(null);
    setCustomDateRange({ start, end });
    setDaysFilter(daysDiff);
  };

  const clearCustomRange = () => {
    setCustomDateRange(null);
    setShowCustomPicker(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: amount > 0 && amount < 1 ? 2 : 0,
      maximumFractionDigits: amount > 0 && amount < 1 ? 2 : 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getPeriodLabel = (days: number) => {
    if (days === 0) return 'All time';
    if (days === 7) return 'Last 7 days';
    if (days === 30) return 'Last 30 days';
    if (days === 90) return 'Last 90 days';
    if (days === 180) return 'Last 180 days';
    if (days === 365) return 'Last year';
    return `Last ${days} days`;
  };


  const quickFilterOptions = [
    { label: '7d', value: 7 },
    { label: '30d', value: 30 },
    { label: '90d', value: 90 },
    { label: '180d', value: 180 },
    { label: '1y', value: 365 },
    { label: 'All time', value: 0 },
  ];

  // Only show full-page loading on initial load, not during search
  if (isLoading && !metrics) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--primary))] border-t-transparent mx-auto"></div>
          <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center p-6">
        <div className="max-w-md w-full border-4 border-[hsl(var(--destructive))] bg-[hsl(var(--surface))] p-6 text-center space-y-4">
          <AlertCircle className="text-[hsl(var(--destructive))] mx-auto" size={48} />
          <h2 className="text-xl font-bold uppercase tracking-[0.16em]">Error Loading Dashboard</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
          <button
            onClick={() => {
              const controller = new AbortController();
              setAbortController(controller);
              fetchMetrics(controller.signal);
            }}
            className="px-6 py-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-(--radius) text-xs font-semibold uppercase tracking-[0.24em] hover:-translate-y-0.5 hover:shadow-lg transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Tab navigation component
  const TabNavigation = () => (
    <div className="flex items-center gap-1 border-b-2 border-[hsl(var(--border-strong))] mb-6 overflow-x-auto -mx-0.5 sm:mx-0 pb-0.5">
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`px-3 sm:px-6 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap touch-manipulation ${
          activeTab === 'dashboard'
            ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
            : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
        }`}
      >
        <BarChart3 size={14} className="sm:w-4 sm:h-4" />
        <span>Dashboard</span>
      </button>
      <button
        onClick={() => setActiveTab('marketing')}
        className={`px-3 sm:px-6 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap touch-manipulation ${
          activeTab === 'marketing'
            ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
            : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
        }`}
      >
        <TrendingUp size={14} className="sm:w-4 sm:h-4" />
        <span>Marketing</span>
      </button>
      <button
        onClick={() => setActiveTab('referrals')}
        className={`px-3 sm:px-6 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap touch-manipulation ${
          activeTab === 'referrals'
            ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
            : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
        }`}
      >
        <LinkIcon size={14} className="sm:w-4 sm:h-4" />
        <span>Referrals</span>
      </button>
      <button
        onClick={() => setActiveTab('analytics')}
        className={`px-3 sm:px-6 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap touch-manipulation ${
          activeTab === 'analytics'
            ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
            : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
        }`}
      >
        <BarChart3 size={14} className="sm:w-4 sm:h-4" />
        <span>Analytics</span>
      </button>
      <button
        onClick={() => setActiveTab('engagement')}
        className={`px-3 sm:px-6 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap touch-manipulation ${
          activeTab === 'engagement'
            ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
            : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
        }`}
      >
        <Mail size={14} className="sm:w-4 sm:h-4" />
        <span>Engagement</span>
      </button>
      <button
        onClick={() => setActiveTab('funnel')}
        className={`px-3 sm:px-6 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap touch-manipulation ${
          activeTab === 'funnel'
            ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
            : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
        }`}
      >
        <Target size={14} className="sm:w-4 sm:h-4" />
        <span>Funnel</span>
      </button>
      <button
        onClick={() => setActiveTab('support')}
        className={`px-3 sm:px-6 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap touch-manipulation ${
          activeTab === 'support'
            ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
            : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
        }`}
      >
        <Shield size={14} className="sm:w-4 sm:h-4" />
        <span>Support</span>
      </button>
    </div>
  );

  // Render marketing tab (Leads + Attribution)
  if (activeTab === 'marketing') {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] p-3 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="pb-3 sm:pb-4 border-b-2 border-[hsl(var(--border-strong))]">
            <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.16em] mb-2">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Marketing & Acquisition
            </p>
          </div>
          <TabNavigation />
          <MarketingTab />
        </div>
      </div>
    );
  }

  // Render referrals tab (Referrals + Fraud)
  if (activeTab === 'referrals') {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] p-3 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="pb-3 sm:pb-4 border-b-2 border-[hsl(var(--border-strong))]">
            <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.16em] mb-2">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Referral Program Management
            </p>
          </div>
          <TabNavigation />
          <ReferralsTab />
        </div>
      </div>
    );
  }

  // Render analytics tab
  if (activeTab === 'analytics') {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] p-3 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="pb-3 sm:pb-4 border-b-2 border-[hsl(var(--border-strong))]">
            <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.16em] mb-2">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              A/B Tests & User Behavior Analysis
            </p>
          </div>
          <TabNavigation />
          <AnalyticsTab />
        </div>
      </div>
    );
  }

  // Render engagement tab
  if (activeTab === 'engagement') {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] p-3 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="pb-3 sm:pb-4 border-b-2 border-[hsl(var(--border-strong))]">
            <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.16em] mb-2">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Engagement Email Campaigns
            </p>
          </div>
          <TabNavigation />
          <EngagementEmailsTab />
        </div>
      </div>
    );
  }

  // Render funnel tab
  if (activeTab === 'funnel') {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] p-3 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="pb-3 sm:pb-4 border-b-2 border-[hsl(var(--border-strong))]">
            <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.16em] mb-2">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Activation Funnel & Drop-off Analysis
            </p>
          </div>
          <TabNavigation />
          <ActivationFunnelTab />
        </div>
      </div>
    );
  }

  // Render support tab
  if (activeTab === 'support') {
    return <SupportTab TabNavigation={TabNavigation} />;
  }

  if (!metrics) return null;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b-2 border-[hsl(var(--border-strong))]">
          <div className="flex-1 pr-44 md:pr-0">
            <h1 className="text-xl sm:text-3xl font-bold uppercase tracking-[0.16em] mb-2">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Actionable Insights & Product Metrics
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabNavigation />

        {/* Dashboard Controls - Period Filters & Refresh */}
        <div className="flex flex-col gap-3 p-4 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Period:</span>
              {quickFilterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setDaysFilter(option.value);
                    setCustomDateRange(null);
                    setShowCustomPicker(false);
                    setSearchQuery('');
                  }}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] rounded transition-all cursor-pointer ${
                    daysFilter === option.value && !customDateRange
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] hover:border-[hsl(var(--primary))] hover:-translate-y-0.5'
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <button
                onClick={() => setShowCustomPicker(!showCustomPicker)}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] rounded transition-all cursor-pointer ${
                  customDateRange
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] hover:border-[hsl(var(--primary))] hover:-translate-y-0.5'
                }`}
              >
                <Calendar size={14} className="inline mr-1" />
                Custom
              </button>
            </div>
            
            <button
              onClick={() => {
                const controller = new AbortController();
                setAbortController(controller);
                fetchMetrics(controller.signal);
              }}
              disabled={isLoading}
              className="px-4 py-2 text-xs border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded hover:-translate-y-0.5 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none whitespace-nowrap cursor-pointer"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'Refreshing...' : 'Refresh Metrics'}
            </button>
          </div>
          
          {showCustomPicker && (
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] p-4 rounded-lg">
              <div className="flex items-end gap-4 mb-3">
                <div className="flex-1">
                  <label className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] block mb-1">Start Date</label>
                  <input
                    type="date"
                    max={customDateRange?.end || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] rounded text-sm"
                    onChange={(e) => {
                      const end = customDateRange?.end || new Date().toISOString().split('T')[0];
                      if (e.target.value) {
                        handleCustomDateRange(e.target.value, end);
                      }
                    }}
                    value={customDateRange?.start || ''}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] block mb-1">End Date</label>
                  <input
                    type="date"
                    min={customDateRange?.start || ''}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] rounded text-sm"
                    onChange={(e) => {
                      const start = customDateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      if (e.target.value) {
                        handleCustomDateRange(start, e.target.value);
                      }
                    }}
                    value={customDateRange?.end || new Date().toISOString().split('T')[0]}
                  />
                </div>
                {customDateRange && (
                  <button
                    onClick={clearCustomRange}
                    className="px-4 py-2 text-xs border-2 border-[hsl(var(--border-strong))] rounded hover:bg-[hsl(var(--accent))] hover:-translate-y-0.5 transition-all whitespace-nowrap cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              {error && (
                <div className="text-xs text-red-500 mt-2">{error}</div>
              )}
            </div>
          )}
          
          {customDateRange && (
            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              Custom range: {new Date(customDateRange.start).toLocaleDateString()} - {new Date(customDateRange.end).toLocaleDateString()}
            </div>
          )}
          
          <div className="text-xs text-[hsl(var(--muted-foreground))]">
            <Info size={12} className="inline mr-1" />
            Filter applies to: Period Performance & Product Health metrics. Other sections use smart defaults.
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isSearching ? 'animate-pulse' : ''} text-[hsl(var(--muted-foreground))]`} size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, emails, subscriptions..."
            className="w-full pl-12 pr-4 py-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-sm uppercase tracking-[0.24em] rounded focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] transition-all"
            disabled={isSearching}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDebouncedSearch('');
              }}
              disabled={isSearching}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              <XCircle size={18} />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2">
              <RefreshCw size={16} className="animate-spin text-[hsl(var(--primary))]" />
            </div>
          )}
        </div>

        {/* EXECUTIVE SUMMARY - Always Visible */}
        <div className="border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 p-6 rounded-lg">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="text-[hsl(var(--primary))]" size={24} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold uppercase tracking-[0.16em]">Executive Summary</h2>
                <TimeContextBadge context="current" />
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
                Current state metrics - always up-to-date, no date filter applied.
                These show your current business health (MRR, active subscriptions, WAU) regardless of the selected period.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Monthly Recurring Revenue"
                  value={formatCurrency(metrics.executiveSummary.monthlyRecurringRevenue)}
                  subtitle={`ARR: ${formatCurrency(metrics.executiveSummary.annualRecurringRevenue)}`}
                  icon={<DollarSign size={16} />}
                  highlight={true}
                  timeContext="current"
                />
                <MetricCard
                  label="Active Subscriptions"
                  value={formatNumber(metrics.executiveSummary.activeSubscriptions)}
                  icon={<CheckCircle size={16} />}
                  timeContext="current"
                />
                <MetricCard
                  label="Weekly Active Users"
                  value={formatNumber(metrics.executiveSummary.wau)}
                  subtitle={
                    Number.isFinite(metrics.executiveSummary.wauChange)
                      ? `WoW: ${metrics.executiveSummary.wauChange >= 0 ? '+' : ''}${metrics.executiveSummary.wauChange.toFixed(1)}%`
                      : undefined
                  }
                  trend={
                    Number.isFinite(metrics.executiveSummary.wauChange)
                      ? metrics.executiveSummary.wauChange
                      : undefined
                  }
                  icon={<UserCheck size={16} />}
                  timeContext="current"
                />
                <MetricCard
                  label="System Health"
                  value={healthStatus?.status === 'healthy' ? 'Healthy' : 'Issues'}
                  subtitle={healthStatus?.mongodb.connected ? 'MongoDB: Connected' : 'MongoDB: Disconnected'}
                  icon={healthStatus?.status === 'healthy' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  timeContext="current"
                />
              </div>
            </div>
          </div>
        </div>

        {/* PERIOD PERFORMANCE */}
        <CollapsibleSection
          title="Period Performance"
          icon={<TrendingUp className="text-[hsl(var(--primary))]" size={20} />}
          isExpanded={expandedSections.periodPerformance}
          onToggle={() => toggleSection('periodPerformance')}
          timeContext="period"
          description={`Metrics for ${customDateRange ? `${new Date(customDateRange.start).toLocaleDateString()} - ${new Date(customDateRange.end).toLocaleDateString()}` : getPeriodLabel(daysFilter)} - Respects date filter`}
        >
          <div className="mb-4 p-3 bg-[hsl(var(--accent))]/10 border border-[hsl(var(--border-strong))] rounded text-xs text-[hsl(var(--muted-foreground))]">
            <strong className="text-[hsl(var(--foreground))]">Why Period-Based?</strong> These metrics show activity within your selected time window, 
            making it easy to compare performance across different periods (e.g., &quot;How did we do this month vs last month?&quot;). 
            All calculations filter data to only include events within the selected date range.
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="New Users"
                value={formatNumber(metrics.periodPerformance.users.newInPeriod)}
                subtitle={`${formatNumber(metrics.periodPerformance.users.newLast7Days)} in last 7d`}
                trend={metrics.comparisons?.changes.newUsers}
                icon={<Users size={16} />}
                timeContext="period"
              />
              <MetricCard
                label="Revenue"
                value={formatCurrency(metrics.periodPerformance.revenue.revenueInPeriod)}
                subtitle={`${formatCurrency(metrics.periodPerformance.revenue.revenueLast7Days)} in last 7d`}
                trend={metrics.comparisons?.changes.revenue}
                icon={<DollarSign size={16} />}
                timeContext="period"
              />
              <MetricCard
                label="Projects Created"
                value={formatNumber(metrics.periodPerformance.projects.createdInPeriod)}
                trend={metrics.comparisons?.changes.projectsCreated}
                icon={<FileText size={16} />}
                timeContext="period"
              />
              <MetricCard
                label="AI Words Generated"
                value={formatNumber(metrics.periodPerformance.usage.aiWordsInPeriod)}
                subtitle={`${formatNumber(metrics.periodPerformance.usage.plagiarismChecksInPeriod)} plagiarism checks · ${formatNumber(metrics.periodPerformance.usage.topicFinderSearchesInPeriod)} topic searches · ${formatNumber(metrics.periodPerformance.usage.paraphraseUsesInPeriod || 0)} rewrites · ${formatNumber(metrics.periodPerformance.usage.litReviewAnalysesInPeriod || 0)} lit reviews`}
                trend={metrics.comparisons?.changes.aiWords}
                icon={<Activity size={16} />}
                timeContext="period"
              />
            </div>
            
            {/* Growth Charts */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <TimeSeriesChart
                data={metrics.periodPerformance.users.growth || []}
                title="User Growth"
                valueLabel="New Users"
                color="hsl(var(--primary))"
                height={250}
                startDate={metrics.dateRange.start}
                endDate={metrics.dateRange.end}
                days={metrics.dateRange.days}
              />
              <TimeSeriesChart
                data={metrics.periodPerformance.usage.growth || []}
                title="AI Words Generated"
                valueLabel="Words"
                color="hsl(var(--accent))"
                height={250}
                startDate={metrics.dateRange.start}
                endDate={metrics.dateRange.end}
                days={metrics.dateRange.days}
              />
              <TimeSeriesChart
                data={metrics.periodPerformance.revenue.growth || []}
                title="Revenue"
                valueLabel="USD"
                color="hsl(var(--primary))"
                height={250}
                startDate={metrics.dateRange.start}
                endDate={metrics.dateRange.end}
                days={metrics.dateRange.days}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* BUSINESS METRICS */}
        <CollapsibleSection
          title="Business Metrics"
          icon={<BarChart3 className="text-[hsl(var(--primary))]" size={20} />}
          isExpanded={expandedSections.businessMetrics}
          onToggle={() => toggleSection('businessMetrics')}
          timeContext="mixed"
          description="Mix of current state and all-time metrics"
        >
          <div className="mb-4 p-3 bg-[hsl(var(--accent))]/10 border border-[hsl(var(--border-strong))] rounded text-xs text-[hsl(var(--muted-foreground))]">
            <strong className="text-[hsl(var(--foreground))]">Why Mixed?</strong> Business metrics combine current state (MRR, active subscriptions) 
            with all-time totals (total revenue, conversion rate, ARPU). Current metrics show today&apos;s health, 
            while all-time metrics show cumulative performance. This gives both a snapshot and historical context.
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                label="Total Revenue"
                value={formatCurrency(metrics.businessMetrics.revenue.totalRevenue)}
                subtitle="All-time revenue"
                icon={<DollarSign size={16} />}
                timeContext="all-time"
              />
              <MetricCard
                label="Conversion Rate"
                value={
                  Number.isFinite(metrics.businessMetrics.users.conversionRate)
                    ? `${metrics.businessMetrics.users.conversionRate.toFixed(1)}%`
                    : 'N/A'
                }
                subtitle={`${formatNumber((metrics.businessMetrics.users.standard ?? 0) + metrics.businessMetrics.users.pro + metrics.businessMetrics.users.team)} paid / ${formatNumber(metrics.businessMetrics.users.total)} total`}
                icon={<Zap size={16} />}
                timeContext="all-time"
                benchmark={{
                  value: BENCHMARKS.conversionRate.average,
                  label: "Industry Avg"
                }}
              />
              <MetricCard
                label="ARPU (All Users)"
                value={formatCurrency(metrics.businessMetrics.monetization.arpu)}
                subtitle={`Per subscriber: ${formatCurrency(metrics.businessMetrics.monetization.arpuActive)}/mo`}
                icon={<BarChart3 size={16} />}
                timeContext="all-time"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* CORE METRICS */}
        <CollapsibleSection
          title="Core Metrics"
          icon={<Activity className="text-[hsl(var(--primary))]" size={20} />}
          isExpanded={expandedSections.coreMetrics}
          onToggle={() => toggleSection('coreMetrics')}
          badge={`WAU: ${metrics.coreMetrics.wau} · MAU: ${metrics.coreMetrics.mau}`}
          timeContext="fixed-window"
          description="Key metrics for academic writing product health"
        >
          <div className="mb-4 p-3 bg-[hsl(var(--accent))]/10 border border-[hsl(var(--border-strong))] rounded text-xs text-[hsl(var(--muted-foreground))]">
            <strong className="text-[hsl(var(--foreground))]">Why These Metrics?</strong> Academic work runs on weekly cycles.
            WAU captures this better than DAU. Activation rate, retention cohorts, project completion, and writing depth
            measure real value delivery rather than vanity engagement.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              label="Weekly Active Users"
              value={formatNumber(metrics.coreMetrics.wau)}
              subtitle={
                Number.isFinite(metrics.coreMetrics.wauChange)
                  ? `WoW: ${metrics.coreMetrics.wauChange >= 0 ? '+' : ''}${metrics.coreMetrics.wauChange.toFixed(1)}%`
                  : undefined
              }
              trend={
                Number.isFinite(metrics.coreMetrics.wauChange)
                  ? metrics.coreMetrics.wauChange
                  : undefined
              }
              icon={<UserCheck size={16} />}
              timeContext="fixed-window"
              explanation="Distinct users with any activity in the last 7 days. Academic work runs on weekly cycles, making WAU more meaningful than DAU."
            />
            <MetricCard
              label="Monthly Active Users"
              value={formatNumber(metrics.coreMetrics.mau)}
              subtitle={(() => {
                const { wau, mau } = metrics.coreMetrics;
                const stickiness =
                  Number.isFinite(wau) && Number.isFinite(mau) && mau > 0
                    ? ((wau / mau) * 100).toFixed(1)
                    : null;
                return stickiness ? `Stickiness: ${stickiness}%` : 'Stickiness: N/A';
              })()}
              icon={<Users size={16} />}
              timeContext="fixed-window"
              explanation="Distinct users with any activity in the last 30 days. Stickiness = WAU/MAU — higher means users come back weekly, not just monthly."
            />
            <MetricCard
              label="Activation Rate"
              value={
                Number.isFinite(metrics.coreMetrics.activationRate)
                  ? `${metrics.coreMetrics.activationRate.toFixed(1)}%`
                  : 'N/A'
              }
              subtitle={`${formatNumber(metrics.coreMetrics.activationActivated)} / ${formatNumber(metrics.coreMetrics.activationTotal)} users${metrics.coreMetrics.avgTimeToActivation ? ` · Avg ${Math.round(metrics.coreMetrics.avgTimeToActivation)}min` : ''}`}
              icon={<Zap size={16} />}
              timeContext="period"
              explanation="Of users who signed up in the selected period, what percentage generated their first AI output. Matches the Activation Funnel (step 3)."
            />
            <MetricCard
              label="Week 1 Retention"
              value={
                Number.isFinite(metrics.coreMetrics.week1Retention)
                  ? `${metrics.coreMetrics.week1Retention.toFixed(1)}%`
                  : 'N/A'
              }
              subtitle={`${formatNumber(metrics.coreMetrics.week1CohortSize)} users in cohort`}
              icon={<Repeat size={16} />}
              timeContext="fixed-window"
              explanation="Of all users who signed up at least 2 weeks ago, what percentage had activity 7-14 days after signup. Shows who returns after the first week."
            />
            <MetricCard
              label="Week 4 Retention"
              value={
                Number.isFinite(metrics.coreMetrics.week4Retention)
                  ? `${metrics.coreMetrics.week4Retention.toFixed(1)}%`
                  : 'N/A'
              }
              subtitle={`${formatNumber(metrics.coreMetrics.week4CohortSize)} users in cohort`}
              icon={<Repeat size={16} />}
              timeContext="fixed-window"
              explanation="Of all users who signed up at least 5 weeks ago, what percentage had activity 21-28 days after signup. Shows who sticks after the first month."
            />
            <MetricCard
              label="Projects Completed"
              value={formatNumber(metrics.coreMetrics.projectsCompleted)}
              subtitle={customDateRange ? `${new Date(customDateRange.start).toLocaleDateString()} - ${new Date(customDateRange.end).toLocaleDateString()}` : getPeriodLabel(daysFilter)}
              trend={metrics.coreMetrics.projectsCompletedChange}
              icon={<CheckCircle size={16} />}
              timeContext="period"
              explanation="Output metric. Projects marked as completed in the selected period. Compared against the previous period of equal length."
            />
            <MetricCard
              label="Words per Active Day"
              value={formatNumber(Math.round(metrics.coreMetrics.wordsPerActiveDay))}
              subtitle={`AI words / active user-days · ${customDateRange ? `${new Date(customDateRange.start).toLocaleDateString()} - ${new Date(customDateRange.end).toLocaleDateString()}` : getPeriodLabel(daysFilter)}`}
              icon={<BarChart3 size={16} />}
              timeContext="period"
              explanation="Depth metric. Total AI words generated divided by total active user-days in the selected period."
            />
          </div>
        </CollapsibleSection>

        {/* PRODUCT HEALTH */}
        <CollapsibleSection
          title="Product Health"
          icon={<Target className="text-[hsl(var(--primary))]" size={20} />}
          isExpanded={expandedSections.productHealth}
          onToggle={() => toggleSection('productHealth')}
          timeContext="period"
          description={`Product metrics for ${customDateRange ? `${new Date(customDateRange.start).toLocaleDateString()} - ${new Date(customDateRange.end).toLocaleDateString()}` : getPeriodLabel(daysFilter)}`}
        >
          <div className="mb-4 p-3 bg-[hsl(var(--accent))]/10 border border-[hsl(var(--border-strong))] rounded text-xs text-[hsl(var(--muted-foreground))]">
            <strong className="text-[hsl(var(--foreground))]">Why Period-Based?</strong> Product metrics like completion rate and feature adoption 
            are calculated for projects created within your selected period. This shows how product usage trends over time 
            (e.g., &quot;Are users completing more projects this quarter vs last quarter?&quot;) rather than just cumulative totals.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              label="Behavioral Completion Rate"
              value={
                Number.isFinite(metrics.productHealth.behavioralCompletionRate)
                  ? `${metrics.productHealth.behavioralCompletionRate.toFixed(1)}%`
                  : 'N/A'
              }
              subtitle={`${formatNumber(metrics.productHealth.projects.behaviorallyCompleted)} projects reached 80% of target + no edits 7d`}
              icon={<CheckCircle size={16} />}
              timeContext="all-time"
              benchmark={{
                value: BENCHMARKS.completionRate.average,
                label: "Average"
              }}
            />
            <MetricCard
              label="User-Reported Completion"
              value={
                Number.isFinite(metrics.productHealth.completionRate)
                  ? `${metrics.productHealth.completionRate.toFixed(1)}%`
                  : 'N/A'
              }
              subtitle={`${formatNumber(metrics.productHealth.projects.completed)} / ${formatNumber(metrics.productHealth.projects.total)} marked complete`}
              icon={<CheckCircle size={16} />}
              timeContext="all-time"
            />
            <MetricCard
              label="Projects per User"
              value={
                Number.isFinite(metrics.productHealth.avgProjectsPerUser)
                  ? metrics.productHealth.avgProjectsPerUser.toFixed(1)
                  : 'N/A'
              }
              subtitle={`${formatNumber(metrics.productHealth.usersWithMultipleProjects)} users with multiple`}
              icon={<FileText size={16} />}
              timeContext="all-time"
            />
            <MetricCard
              label="Citation Adoption"
              value={
                Number.isFinite(metrics.productHealth.citationAdoption)
                  ? `${metrics.productHealth.citationAdoption.toFixed(1)}%`
                  : 'N/A'
              }
              subtitle={`PDF: ${
                Number.isFinite(metrics.productHealth.pdfAdoption)
                  ? `${metrics.productHealth.pdfAdoption.toFixed(1)}%`
                  : 'N/A'
              } • Plagiarism: ${
                Number.isFinite(metrics.productHealth.plagiarismAdoption)
                  ? `${metrics.productHealth.plagiarismAdoption.toFixed(1)}%`
                  : 'N/A'
              } • Lit Review: ${
                Number.isFinite(metrics.productHealth.litReviewAdoption)
                  ? `${metrics.productHealth.litReviewAdoption.toFixed(1)}%`
                  : 'N/A'
              }`}
              icon={<Sparkles size={16} />}
              timeContext="all-time"
            />
          </div>
        </CollapsibleSection>

        {/* ADVISOR REVIEWS */}
        <CollapsibleSection
          title="Advisor Reviews"
          icon={<Share2 className="text-[hsl(var(--primary))]" size={20} />}
          isExpanded={expandedSections.advisorReviews}
          onToggle={() => toggleSection('advisorReviews')}
          timeContext="period"
          description={`Review sharing metrics for ${customDateRange ? `${new Date(customDateRange.start).toLocaleDateString()} - ${new Date(customDateRange.end).toLocaleDateString()}` : getPeriodLabel(daysFilter)}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              label="Share Links Created"
              value={formatNumber(metrics.reviewMetrics.totalShareLinks)}
              subtitle={`${formatNumber(metrics.reviewMetrics.activeShareLinks)} currently active`}
              icon={<Share2 size={16} />}
              timeContext="period"
            />
            <MetricCard
              label="Review Comments"
              value={formatNumber(metrics.reviewMetrics.totalComments)}
              subtitle={`${formatNumber(metrics.reviewMetrics.resolvedComments)} resolved (${metrics.reviewMetrics.resolutionRate}%)`}
              icon={<MessageSquare size={16} />}
              timeContext="period"
            />
            <MetricCard
              label="Projects with Reviews"
              value={formatNumber(metrics.reviewMetrics.projectsWithShares)}
              subtitle="Unique projects shared for review"
              icon={<FileText size={16} />}
              timeContext="period"
            />
          </div>
        </CollapsibleSection>

        {/* RETENTION */}
        <CollapsibleSection
          title="Retention Metrics"
          icon={<Repeat className="text-[hsl(var(--primary))]" size={20} />}
          isExpanded={expandedSections.retention}
          onToggle={() => toggleSection('retention')}
          timeContext="fixed-window"
          description="Cohort-based retention and churn metrics"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Week 1 Retention"
              value={`${metrics.retention.week1Retention.toFixed(1)}%`}
              subtitle={`${formatNumber(metrics.retention.week1CohortSize)} users in cohort`}
              icon={<Repeat size={16} />}
              timeContext="fixed-window"
              explanation="Of all users who signed up at least 2 weeks ago, what percentage returned in their second week."
            />
            <MetricCard
              label="Week 4 Retention"
              value={`${metrics.retention.week4Retention.toFixed(1)}%`}
              subtitle={`${formatNumber(metrics.retention.week4CohortSize)} users in cohort`}
              icon={<Repeat size={16} />}
              timeContext="fixed-window"
              explanation="Of all users who signed up at least 5 weeks ago, what percentage returned in their fourth week."
            />
            <MetricCard
              label="WoW Retention"
              value={`${metrics.retention.wowRetention.toFixed(1)}%`}
              subtitle="Last week&apos;s users returning this week"
              icon={<TrendingUp size={16} />}
              timeContext="fixed-window"
              explanation="Percentage of last week&apos;s active users who are also active this week"
            />
            <MetricCard
              label="Churn Rate"
              value={`${metrics.retention.churnRate.toFixed(1)}%`}
              subtitle={`${formatNumber(metrics.retention.churnedUsers)} users churned`}
              icon={metrics.retention.churnRate > 10 ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              timeContext="fixed-window"
              benchmark={{
                value: BENCHMARKS.churnRate.average,
                label: "Average"
              }}
            />
          </div>
        </CollapsibleSection>

        {/* DETAILED LISTS */}
        <CollapsibleSection
          title="Detailed Lists"
          icon={<Users className="text-[hsl(var(--primary))]" size={20} />}
          isExpanded={expandedSections.detailedLists}
          onToggle={() => toggleSection('detailedLists')}
        >
          <div className="space-y-6">
            {(() => {
              // Get users list
              const usersList = topUsersUsage && topUsersUsage.length > 0
                ? topUsersUsage
                : metrics.detailedLists.topUsersByUsage;
              
              // Filter by search query if present (client-side fallback)
              let filteredUsers = usersList;
              if (debouncedSearch && debouncedSearch.trim().length > 0) {
                const searchLower = debouncedSearch.trim().toLowerCase();
                filteredUsers = usersList.filter((user: { email?: string; name?: string }) => 
                  (user.email || '').toLowerCase().includes(searchLower) ||
                  (user.name || '').toLowerCase().includes(searchLower)
                );
              }
              
              return (filteredUsers.length > 0 || usersList.length > 0) ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-[0.24em]">Top Users by Usage</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          exportUsersToCSV(
                            (topUsersUsage && topUsersUsage.length > 0
                              ? topUsersUsage
                              : metrics.detailedLists.topUsersByUsage) as Array<{ name?: string; email?: string; plan?: string; totalAIWords?: number; totalPlagiarismChecks?: number; totalTopicFinderSearches?: number; totalCitations?: number; projectsWithCitations?: number; activeDays?: number; _id?: string }>,
                          )
                        }
                        className="px-4 py-2 text-xs border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded hover:bg-[hsl(var(--accent))] hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <FileText size={14} />
                        Export Top 20 CSV
                      </button>
                      <button
                        onClick={exportAllUsersUsageToCSV}
                        disabled={isLoading}
                        className="px-4 py-2 text-xs border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded hover:-translate-y-0.5 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
                      >
                        <FileText size={14} />
                        {isLoading ? 'Loading...' : 'Export All Users Usage'}
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[hsl(var(--border-strong))]">
                          <th className="text-left py-2 px-3 text-xs uppercase">Rank</th>
                          <th className="text-left py-2 px-3 text-xs uppercase">Name</th>
                          <th className="text-left py-2 px-3 text-xs uppercase">Email</th>
                          <th className="text-left py-2 px-3 text-xs uppercase">Plan</th>
                          <th className="text-right py-2 px-3 text-xs uppercase">AI Words</th>
                          <th className="text-right py-2 px-3 text-xs uppercase">Checks</th>
                          <th className="text-right py-2 px-3 text-xs uppercase">Topics</th>
                          <th className="text-right py-2 px-3 text-xs uppercase">Rewrites</th>
                          <th className="text-right py-2 px-3 text-xs uppercase">Lit Reviews</th>
                          <th className="text-right py-2 px-3 text-xs uppercase">Citations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isSearching && filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-4 px-3 text-center text-xs text-[hsl(var(--muted-foreground))]">
                              <div className="flex items-center justify-center gap-2">
                                <RefreshCw size={14} className="animate-spin" />
                                <span>Searching...</span>
                              </div>
                            </td>
                          </tr>
                        ) : filteredUsers.length > 0 ? (
                          filteredUsers.slice(0, 10).map((user: { userId?: string; _id?: string; name?: string; email?: string; plan?: string; totalAIWords?: number; totalPlagiarismChecks?: number; totalTopicFinderSearches?: number; totalParaphraseUses?: number; totalLitReviewAnalyses?: number; totalCitations?: number; activeDays?: number }, idx: number) => (
                            <tr key={user.userId} className="border-b border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--accent))]/5">
                              <td className="py-2 px-3 font-bold">#{idx + 1}</td>
                              <td className="py-2 px-3 font-medium">{user.name || 'N/A'}</td>
                              <td className="py-2 px-3">{user.email || 'N/A'}</td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  user.plan === 'pro' ? 'bg-blue-500/20 text-blue-500' :
                                  user.plan === 'standard' ? 'bg-cyan-500/20 text-cyan-600' :
                                  user.plan === 'team' ? 'bg-purple-500/20 text-purple-500' :
                                  'bg-gray-500/20 text-gray-500'
                                }`}>
                                  {user.plan || 'free'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-semibold">{formatNumber(user.totalAIWords || 0)}</td>
                              <td className="py-2 px-3 text-right">{formatNumber(user.totalPlagiarismChecks || 0)}</td>
                              <td className="py-2 px-3 text-right">{formatNumber(user.totalTopicFinderSearches || 0)}</td>
                              <td className="py-2 px-3 text-right">{formatNumber(user.totalParaphraseUses || 0)}</td>
                              <td className="py-2 px-3 text-right">{formatNumber(user.totalLitReviewAnalyses || 0)}</td>
                              <td className="py-2 px-3 text-right">{formatNumber(user.totalCitations || 0)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={10} className="py-4 px-3 text-center text-xs text-[hsl(var(--muted-foreground))]">
                              {debouncedSearch ? 'No users found matching your search' : 'No users found'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null;
            })()}

            {(recentUsers && recentUsers.length > 0) || metrics.detailedLists.recentUsers.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-[0.24em]">Recent Users</h3>
                  <button
                    onClick={() =>
                      exportUsersToCSV(
                        (recentUsers && recentUsers.length > 0
                          ? recentUsers
                          : metrics.detailedLists.recentUsers.map(u => ({
                              _id: u._id,
                              userId: u._id,
                              email: u.email,
                              name: u.name,
                              plan: u.plan,
                              createdAt: u.createdAt,
                              stripeSubscriptionId: u.stripeSubscriptionId,
                              totalAIWords: u.totalAIWords || 0,
                              totalPlagiarismChecks: u.totalPlagiarismChecks || 0,
                              totalCitations: u.totalCitations || 0,
                              projectsWithCitations: u.projectsWithCitations || 0,
                            }))),
                      )
                    }
                    className="px-4 py-2 text-xs border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded hover:bg-[hsl(var(--accent))] hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <FileText size={14} />
                    Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[hsl(var(--border-strong))]">
                        <th className="text-left py-2 px-3 text-xs uppercase">Name</th>
                        <th className="text-left py-2 px-3 text-xs uppercase">Email</th>
                        <th className="text-left py-2 px-3 text-xs uppercase">Plan</th>
                        <th className="text-right py-2 px-3 text-xs uppercase">AI Words</th>
                        <th className="text-right py-2 px-3 text-xs uppercase">Plagiarism Checks</th>
                        <th className="text-right py-2 px-3 text-xs uppercase">Topic Searches</th>
                        <th className="text-right py-2 px-3 text-xs uppercase">Rewrites</th>
                        <th className="text-right py-2 px-3 text-xs uppercase">Lit Reviews</th>
                        <th className="text-right py-2 px-3 text-xs uppercase">Citations</th>
                        <th className="text-right py-2 px-3 text-xs uppercase">Active Days</th>
                        <th className="text-left py-2 px-3 text-xs uppercase">Subscription</th>
                        <th className="text-left py-2 px-3 text-xs uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Get users list
                        const usersList = recentUsers && recentUsers.length > 0
                          ? recentUsers
                          : metrics.detailedLists.recentUsers;
                        
                        // Filter by search query if present (client-side fallback for metrics data)
                        // Note: API already filters recentUsers, but metrics.detailedLists.recentUsers might not be filtered
                        let filteredUsers = usersList;
                        if (debouncedSearch && debouncedSearch.trim().length > 0 && !recentUsers) {
                          // Only filter metrics data, API data is already filtered
                          const searchLower = debouncedSearch.trim().toLowerCase();
                          filteredUsers = usersList.filter((user: { email?: string; name?: string }) => 
                            (user.email || '').toLowerCase().includes(searchLower) ||
                            (user.name || '').toLowerCase().includes(searchLower)
                          );
                        }
                        
                        return filteredUsers.slice(0, 20).map((user: { _id?: string; userId?: string; name?: string; email?: string; plan?: string; createdAt?: string | Date; totalAIWords?: number; totalPlagiarismChecks?: number; totalTopicFinderSearches?: number; totalParaphraseUses?: number; totalLitReviewAnalyses?: number; totalCitations?: number; activeDays?: number; stripeSubscriptionId?: string }) => (
                          <tr key={user._id || user.userId} className="border-b border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--accent))]/5">
                          <td className="py-2 px-3 font-medium">{user.name || 'N/A'}</td>
                          <td className="py-2 px-3">{user.email || 'N/A'}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              user.plan === 'pro' ? 'bg-blue-500/20 text-blue-500' :
                              user.plan === 'standard' ? 'bg-cyan-500/20 text-cyan-600' :
                              user.plan === 'team' ? 'bg-purple-500/20 text-purple-500' :
                              'bg-gray-500/20 text-gray-500'
                            }`}>
                              {user.plan || 'free'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-semibold">{formatNumber(user.totalAIWords || 0)}</td>
                          <td className="py-2 px-3 text-right">{formatNumber(user.totalPlagiarismChecks || 0)}</td>
                          <td className="py-2 px-3 text-right">{formatNumber(user.totalTopicFinderSearches || 0)}</td>
                          <td className="py-2 px-3 text-right">{formatNumber(user.totalParaphraseUses || 0)}</td>
                          <td className="py-2 px-3 text-right">{formatNumber(user.totalLitReviewAnalyses || 0)}</td>
                          <td className="py-2 px-3 text-right">{formatNumber(user.totalCitations || 0)}</td>
                          <td className="py-2 px-3 text-right">{formatNumber(user.activeDays || 0)}</td>
                          <td className="py-2 px-3">
                            {user.stripeSubscriptionId ? (
                              <span className="text-green-500">✓ Active</span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ));
                      })()}
                    </tbody>
                  </table>
                  {(() => {
                    // Calculate filtered total for pagination
                    const usersList = recentUsers && recentUsers.length > 0
                      ? recentUsers
                      : metrics.detailedLists.recentUsers;
                    const displayTotal = recentUsers ? recentUsersTotal : usersList.length;
                    
                    return displayTotal > recentUsersPageSize && (
                    <div className="flex items-center justify-between mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                      <span>
                        Page {recentUsersPage} of {Math.ceil(recentUsersTotal / recentUsersPageSize)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const prev = Math.max(1, recentUsersPage - 1);
                            setRecentUsersPage(prev);
                            recentUsersPageRef.current = prev; // Update ref when page changes
                            fetchRecentUsers(prev);
                          }}
                          disabled={recentUsersPage === 1}
                          className="px-3 py-1 border-2 border-[hsl(var(--border-strong))] rounded disabled:opacity-50 cursor-pointer"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => {
                            const next = Math.min(
                              Math.ceil(recentUsersTotal / recentUsersPageSize),
                              recentUsersPage + 1,
                            );
                            setRecentUsersPage(next);
                            recentUsersPageRef.current = next; // Update ref when page changes
                            fetchRecentUsers(next);
                          }}
                          disabled={recentUsersPage >= Math.ceil(recentUsersTotal / recentUsersPageSize)}
                          className="px-3 py-1 border-2 border-[hsl(var(--border-strong))] rounded disabled:opacity-50 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  );
                  })()}
                </div>
              </div>
            ) : null}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

