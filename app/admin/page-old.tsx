'use client';

// @todo: delete this file?
import { useEffect, useState, useMemo } from 'react';
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
  Filter,
  Search,
  ArrowUpDown,
  Zap,
  ChevronDown,
  ChevronUp,
  Target,
  BarChart3,
  Sparkles,
  UserCheck,
  Repeat,
  Clock,
  CreditCard,
  Info,
  Lightbulb,
  Award
} from 'lucide-react';

interface Metrics {
  users: {
    total: number;
    free: number;
    pro: number;
    team: number;
    withSubscriptions: number;
    newLast30Days: number;
    newLast7Days: number;
    growth: Array<{ _id: string; count: number }>;
    recentUsers?: Array<{ _id: string; name: string; email: string; plan: string; createdAt: string; stripeSubscriptionId?: string }>;
    topUsersByUsage?: Array<{ userId: string; email: string; name: string; plan: string; totalAIWords: number; totalPlagiarismChecks: number }>;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    createdInPeriod: number;
    growth: Array<{ _id: string; count: number }>;
  };
  usage: {
    totalAIWords: number;
    totalPlagiarismChecks: number;
    aiWordsLast30Days: number;
    plagiarismChecksLast30Days: number;
    topUsersByUsage?: Array<{ userId: string; email: string; name: string; plan: string; totalAIWords: number; totalPlagiarismChecks: number }>;
  };
  revenue: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    activeSubscriptions: number;
    paymentFailures: number;
    pastDueSubscriptions: number;
    canceledSubscriptions: number;
    revenueLast30Days: number;
    revenueLast7Days: number;
    subscriptionDetails?: Array<{ id: string; status: string; customerEmail: string; amount: number; interval: string; createdAt: number; currentPeriodEnd: number }>;
  };
  engagement?: {
    dau: number;
    mau: number;
    stickiness: number;
    powerUsers: number;
    consistentUsers: number;
    avgActiveDays: number;
  };
  product?: {
    completionRate: number;
    avgProjectsPerUser: number;
    usersWithMultipleProjects: number;
    citationAdoption: number;
    pdfAdoption: number;
    plagiarismAdoption: number;
  };
  monetization?: {
    arpu: number;
    arpuActive: number;
    avgTimeToConversion: number;
  };
  retention?: {
    churnRate: number;
    churnedUsers: number;
  };
  comparisons?: {
    previousPeriod: {
      newUsers: number;
      projectsCreated: number;
      aiWords: number;
      plagiarismChecks: number;
      revenue: number;
    };
    changes: {
      newUsers: number;
      projectsCreated: number;
      aiWords: number;
      plagiarismChecks: number;
      revenue: number;
    };
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

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: number | string;
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
}

// Industry standard benchmarks
const BENCHMARKS = {
  conversionRate: { excellent: 5, good: 3, average: 1.5 }, // % of free users converting
  churnRate: { excellent: 3, good: 5, average: 10 }, // Monthly churn %
  stickiness: { excellent: 40, good: 25, average: 15 }, // DAU/MAU %
  completionRate: { excellent: 60, good: 40, average: 25 }, // Project completion %
  arpu: { excellent: 50, good: 30, average: 15 }, // $ per user
  timeToConversion: { excellent: 7, good: 14, average: 30 }, // Days
  featureAdoption: { excellent: 50, good: 30, average: 15 }, // % of projects
  dauMauRatio: { excellent: 0.4, good: 0.25, average: 0.15 }, // Ratio
};

// Product-specific goals
const PRODUCT_GOALS = {
  userTarget: 1600, // Total users over 3 months
  userTargetPeriodDays: 90, // 3 months
  conversionTarget: 15, // % conversion to paid plans
};

function MetricCard({ 
  label, 
  value, 
  subtitle, 
  trend, 
  benchmark, 
  goal, 
  explanation, 
  icon,
  highlight = false 
}: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const getTrendColor = (trendValue: number) => {
    if (trendValue > 0) return 'text-green-500';
    if (trendValue < 0) return 'text-red-500';
    return 'text-[hsl(var(--muted-foreground))]';
  };
  
  const getBenchmarkStatus = (current: number, benchmark: { value: number; label: string }) => {
    if (current >= benchmark.value) return 'excellent';
    if (current >= benchmark.value * 0.7) return 'good';
    return 'needs-improvement';
  };
  
  const getGoalProgress = () => {
    if (!goal) return null;
    const progress = (goal.current / goal.target) * 100;
    return Math.min(progress, 100);
  };
  
  return (
    <div className={`border-2 border-[hsl(var(--border-strong))] ${highlight ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--surface))]'} p-4 rounded-lg relative`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          {icon && <span className={highlight ? 'text-[hsl(var(--accent-foreground))]' : ''}>{icon}</span>}
          <span className={`text-xs uppercase tracking-[0.32em] ${highlight ? 'text-[hsl(var(--accent-foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
            {label}
          </span>
          {explanation && (
            <div className="relative">
              <Info 
                size={14} 
                className="text-[hsl(var(--muted-foreground))] cursor-help"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              />
              {showTooltip && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[hsl(var(--popover))] border-2 border-[hsl(var(--border-strong))] rounded-lg text-xs text-left shadow-lg">
                  {explanation}
                </div>
              )}
            </div>
          )}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 ${getTrendColor(trend)}`}>
            {trend > 0 ? <TrendingUp size={14} /> : trend < 0 ? <TrendingDown size={14} /> : null}
            <span className="text-xs font-semibold">
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
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
      
      {goal && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[hsl(var(--muted-foreground))]">{goal.label}</span>
            <span className="text-xs font-semibold">
              {goal.current} / {goal.target} ({getGoalProgress()?.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-[hsl(var(--border-strong))] rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                (getGoalProgress() || 0) >= 100 ? 'bg-green-500' :
                (getGoalProgress() || 0) >= 75 ? 'bg-[hsl(var(--primary))]' :
                (getGoalProgress() || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${getGoalProgress()}%` }}
            />
          </div>
        </div>
      )}
      
      {benchmark && (
        <div className="mt-2 flex items-center gap-2">
          <Award size={12} className="text-[hsl(var(--muted-foreground))]" />
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            Industry {benchmark.label}: {benchmark.value}
            {typeof value === 'number' && (
              <span className={`ml-2 ${
                getBenchmarkStatus(value, benchmark) === 'excellent' ? 'text-green-500' :
                getBenchmarkStatus(value, benchmark) === 'good' ? 'text-yellow-500' : 'text-red-500'
              }`}>
                ({getBenchmarkStatus(value, benchmark)})
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ title, icon, isExpanded, onToggle, children, badge }: CollapsibleSectionProps) {
  return (
    <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--accent))]/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-lg font-bold uppercase tracking-[0.16em]">{title}</h2>
          {badge !== undefined && (
            <span className="px-2 py-0.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs font-semibold">
              {badge}
            </span>
          )}
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

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysFilter, setDaysFilter] = useState<number>(30);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [userSortBy, setUserSortBy] = useState<'usage' | 'name' | 'recent'>('usage');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    growth: true,
    engagement: true,
    product: true,
    monetization: true,
    retention: false,
    users: false,
    subscriptions: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Debounce search for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchHealthStatus();
    fetchMetrics();
    const interval = setInterval(() => {
      fetchHealthStatus();
      fetchMetrics();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [daysFilter]);

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/admin/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch (err) {
      console.error('Failed to fetch health status:', err);
    }
  };

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/metrics?days=${daysFilter}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to fetch metrics');
      }
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Memoized filtered and sorted top users
  const filteredTopUsers = useMemo(() => {
    if (!metrics?.usage.topUsersByUsage) return [];
    
    let filtered = [...metrics.usage.topUsersByUsage];
    
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter((user) => {
        return (
          (user.email && user.email.toLowerCase().includes(query)) ||
          (user.name && user.name.toLowerCase().includes(query))
        );
      });
    }
    
    if (userSortBy === 'name') {
      filtered.sort((a, b) => {
        const nameA = (a.name || a.email || '').toLowerCase();
        const nameB = (b.name || b.email || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else {
      filtered.sort((a, b) => b.totalAIWords - a.totalAIWords);
    }
    
    return filtered;
  }, [metrics?.usage.topUsersByUsage, debouncedSearch, userSortBy]);

  const filteredRecentUsers = useMemo(() => {
    if (!metrics?.users.recentUsers) return [];
    
    let filtered = [...metrics.users.recentUsers];
    
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter((user) => {
        return (
          (user.email && user.email.toLowerCase().includes(query)) ||
          (user.name && user.name.toLowerCase().includes(query))
        );
      });
    }
    
    if (userSortBy === 'name') {
      filtered.sort((a, b) => {
        const nameA = (a.name || a.email || '').toLowerCase();
        const nameB = (b.name || b.email || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (userSortBy === 'recent') {
      filtered.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
    
    return filtered;
  }, [metrics?.users.recentUsers, debouncedSearch, userSortBy]);

  const filteredSubscriptions = useMemo(() => {
    if (!metrics?.revenue.subscriptionDetails) return [];
    if (!debouncedSearch) return metrics.revenue.subscriptionDetails;
    const query = debouncedSearch.toLowerCase();
    return metrics.revenue.subscriptionDetails.filter((sub) => {
      return sub.customerEmail && sub.customerEmail.toLowerCase().includes(query);
    });
  }, [metrics?.revenue.subscriptionDetails, debouncedSearch]);

  const quickFilterOptions = [
    { label: '7d', value: 7 },
    { label: '30d', value: 30 },
    { label: '90d', value: 90 },
    { label: '180d', value: 180 },
    { label: '1y', value: 365 },
  ];

  if (isLoading) {
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
        <div className="max-w-md w-full border-[4px] border-[hsl(var(--destructive))] bg-[hsl(var(--surface))] p-6 text-center space-y-4">
          <AlertCircle className="text-[hsl(var(--destructive))] mx-auto" size={48} />
          <h2 className="text-xl font-bold uppercase tracking-[0.16em]">Error Loading Dashboard</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
          <button
            onClick={fetchMetrics}
            className="px-6 py-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-[var(--radius)] text-xs font-semibold uppercase tracking-[0.24em] hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const conversionRate = metrics.users.total > 0
    ? ((metrics.users.pro / metrics.users.total) * 100).toFixed(1)
    : '0.0';
  
  // Calculate progress toward 3-month user goal (1600 users)
  // Assuming we're tracking from a start date, calculate days elapsed
  // For now, we'll use the current period as a proxy
  const userGoalProgress = {
    current: metrics.users.total,
    target: PRODUCT_GOALS.userTarget,
    daysElapsed: daysFilter,
    daysTotal: PRODUCT_GOALS.userTargetPeriodDays,
    projectedCompletion: daysFilter > 0 ? (metrics.users.total / daysFilter) * PRODUCT_GOALS.userTargetPeriodDays : 0,
    onTrack: daysFilter > 0 ? (metrics.users.total / daysFilter) * PRODUCT_GOALS.userTargetPeriodDays >= PRODUCT_GOALS.userTarget : false,
  };
  
  // Calculate conversion goal progress (15% target)
  const conversionGoalProgress = {
    current: parseFloat(conversionRate),
    target: PRODUCT_GOALS.conversionTarget,
    neededPaidUsers: Math.ceil((metrics.users.total * PRODUCT_GOALS.conversionTarget / 100) - metrics.users.pro),
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b-2 border-[hsl(var(--border-strong))]">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-[0.16em] mb-2">Admin Dashboard</h1>
            <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Actionable Insights & Product Metrics
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] mr-2">Period:</span>
            {quickFilterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setDaysFilter(option.value);
                  setSearchQuery('');
                }}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] rounded transition-all ${
                  daysFilter === option.value
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] hover:border-[hsl(var(--primary))]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, emails, subscriptions..."
            className="w-full pl-12 pr-4 py-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-sm uppercase tracking-[0.24em] rounded focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              <XCircle size={18} />
            </button>
          )}
        </div>

        {/* INSIGHTS SECTION */}
        <div className="space-y-4">
          {/* GOAL TRACKING SECTION */}
          <div className="border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 p-6 rounded-lg">
            <div className="flex items-start gap-3 mb-4">
              <Target className="text-[hsl(var(--primary))]" size={24} />
              <div className="flex-1">
                <h2 className="text-lg font-bold uppercase tracking-[0.16em] mb-4">Product Goals (3-Month Targets)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User Goal */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold uppercase tracking-[0.16em]">User Acquisition Goal</span>
                      <span className="text-sm font-bold">
                        {formatNumber(userGoalProgress.current)} / {formatNumber(userGoalProgress.target)}
                      </span>
                    </div>
                    <div className="w-full bg-[hsl(var(--border-strong))] rounded-full h-3 mb-2">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          (userGoalProgress.current / userGoalProgress.target) * 100 >= 100 ? 'bg-green-500' :
                          (userGoalProgress.current / userGoalProgress.target) * 100 >= 75 ? 'bg-[hsl(var(--primary))]' :
                          (userGoalProgress.current / userGoalProgress.target) * 100 >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((userGoalProgress.current / userGoalProgress.target) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[hsl(var(--muted-foreground))]">
                        {((userGoalProgress.current / userGoalProgress.target) * 100).toFixed(1)}% complete
                      </span>
                      {userGoalProgress.daysElapsed > 0 && (
                        <span className={`font-semibold ${
                          userGoalProgress.onTrack ? 'text-green-500' : 'text-yellow-500'
                        }`}>
                          {userGoalProgress.onTrack ? '✓ On Track' : '⚠ Behind Target'}
                        </span>
                      )}
                    </div>
                    {userGoalProgress.daysElapsed > 0 && (
                      <div className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                        Projected: {formatNumber(Math.round(userGoalProgress.projectedCompletion))} users in {PRODUCT_GOALS.userTargetPeriodDays} days
                        {!userGoalProgress.onTrack && (
                          <span className="block text-yellow-500 mt-1">
                            Need {formatNumber(Math.ceil((userGoalProgress.target - userGoalProgress.projectedCompletion) / (PRODUCT_GOALS.userTargetPeriodDays - userGoalProgress.daysElapsed)))} users/day to reach goal
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Conversion Goal */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold uppercase tracking-[0.16em]">Conversion Rate Goal</span>
                      <span className="text-sm font-bold">
                        {conversionRate}% / {PRODUCT_GOALS.conversionTarget}%
                      </span>
                    </div>
                    <div className="w-full bg-[hsl(var(--border-strong))] rounded-full h-3 mb-2">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          conversionGoalProgress.current >= conversionGoalProgress.target ? 'bg-green-500' :
                          conversionGoalProgress.current >= conversionGoalProgress.target * 0.75 ? 'bg-[hsl(var(--primary))]' :
                          conversionGoalProgress.current >= conversionGoalProgress.target * 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((conversionGoalProgress.current / conversionGoalProgress.target) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[hsl(var(--muted-foreground))]">
                        {((conversionGoalProgress.current / conversionGoalProgress.target) * 100).toFixed(1)}% of target
                      </span>
                      {conversionGoalProgress.current >= conversionGoalProgress.target ? (
                        <span className="font-semibold text-green-500">✓ Goal Achieved</span>
                      ) : (
                        <span className="font-semibold text-yellow-500">
                          Need {formatNumber(conversionGoalProgress.neededPaidUsers)} more paid users
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                      Current: {formatNumber(metrics.users.pro)} paid / {formatNumber(metrics.users.total)} total
                      {conversionGoalProgress.neededPaidUsers > 0 && (
                        <span className="block text-yellow-500 mt-1">
                          Target: {formatNumber(Math.ceil(metrics.users.total * PRODUCT_GOALS.conversionTarget / 100))} paid users needed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KEY INSIGHTS SECTION */}
          {metrics.comparisons && (
            <div className="border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 p-6 rounded-lg">
              <div className="flex items-start gap-3 mb-4">
                <Lightbulb className="text-[hsl(var(--primary))]" size={24} />
                <div className="flex-1">
                  <h2 className="text-lg font-bold uppercase tracking-[0.16em] mb-2">Key Insights</h2>
                  <div className="space-y-2 text-sm">
                    {metrics.comparisons.changes.newUsers > 20 && (
                      <p className="text-green-500">✓ User growth is strong: {metrics.comparisons.changes.newUsers.toFixed(1)}% increase vs previous period</p>
                    )}
                    {metrics.comparisons.changes.newUsers < -10 && (
                      <p className="text-red-500">⚠ User acquisition declined: {metrics.comparisons.changes.newUsers.toFixed(1)}% vs previous period</p>
                    )}
                    {metrics.comparisons.changes.revenue > 15 && (
                      <p className="text-green-500">✓ Revenue growth accelerating: {metrics.comparisons.changes.revenue.toFixed(1)}% increase</p>
                    )}
                    {parseFloat(conversionRate) >= PRODUCT_GOALS.conversionTarget && (
                      <p className="text-green-500">✓ Conversion rate ({conversionRate}%) meets your {PRODUCT_GOALS.conversionTarget}% goal!</p>
                    )}
                    {parseFloat(conversionRate) < PRODUCT_GOALS.conversionTarget && parseFloat(conversionRate) >= BENCHMARKS.conversionRate.good && (
                      <p className="text-yellow-500">⚠ Conversion rate ({conversionRate}%) is good but below your {PRODUCT_GOALS.conversionTarget}% target</p>
                    )}
                    {parseFloat(conversionRate) < BENCHMARKS.conversionRate.good && (
                      <p className="text-red-500">⚠ Conversion rate ({conversionRate}%) needs improvement to reach {PRODUCT_GOALS.conversionTarget}% goal</p>
                    )}
                    {metrics.retention && parseFloat(metrics.retention.churnRate.toString()) <= BENCHMARKS.churnRate.good && (
                      <p className="text-green-500">✓ Churn rate ({metrics.retention.churnRate}%) is healthy (industry avg: {BENCHMARKS.churnRate.average}%)</p>
                    )}
                    {metrics.retention && parseFloat(metrics.retention.churnRate.toString()) > BENCHMARKS.churnRate.average && (
                      <p className="text-yellow-500">⚠ Churn rate ({metrics.retention.churnRate}%) above industry average - focus on retention</p>
                    )}
                    {metrics.engagement && parseFloat(metrics.engagement.stickiness.toString()) >= BENCHMARKS.stickiness.good && (
                      <p className="text-green-500">✓ High user engagement: {metrics.engagement.stickiness}% stickiness (DAU/MAU)</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PRIORITY METRICS: Growth & Success Indicators */}
        <CollapsibleSection
          title="Growth Metrics"
          icon={<TrendingUp className="text-[hsl(var(--primary))]" size={20} />}
          isExpanded={expandedSections.growth}
          onToggle={() => toggleSection('growth')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="New Users"
              value={formatNumber(metrics.users.newLast30Days)}
              subtitle={`in ${daysFilter}d • ${formatNumber(metrics.users.newLast7Days)} in 7d`}
              trend={metrics.comparisons?.changes.newUsers}
              explanation="New user signups in the selected period. Goal: 1600 users over 3 months (~18 users/day)."
              icon={<Users size={16} />}
              goal={{
                current: metrics.users.newLast30Days,
                target: Math.ceil((PRODUCT_GOALS.userTarget / PRODUCT_GOALS.userTargetPeriodDays) * daysFilter), // Pro-rated goal for current period
                label: `${daysFilter}d Goal (3mo: ${PRODUCT_GOALS.userTarget})`
              }}
            />

            <MetricCard
              label={`Revenue (${daysFilter}d)`}
              value={formatCurrency(metrics.revenue.revenueLast30Days)}
              subtitle={`Total: ${formatCurrency(metrics.revenue.totalRevenue)}`}
              trend={metrics.comparisons?.changes.revenue}
              explanation="Revenue generated from paid subscriptions in the selected period. Includes one-time and recurring payments."
              icon={<DollarSign size={16} />}
              goal={{
                current: metrics.revenue.revenueLast30Days,
                target: Math.max(metrics.comparisons?.previousPeriod.revenue || 0, 100) * 1.15, // 15% growth target
                label: "Revenue Target"
              }}
            />

            <MetricCard
              label="Active Subscriptions"
              value={formatNumber(metrics.revenue.activeSubscriptions)}
              subtitle={`MRR: ${formatCurrency(metrics.revenue.monthlyRecurringRevenue)}`}
              explanation="Number of currently active paid subscriptions. This is your core revenue base."
              icon={<CheckCircle size={16} />}
              highlight={true}
            />

            <MetricCard
              label="Conversion Rate"
              value={`${conversionRate}%`}
              subtitle={`${formatNumber(metrics.users.pro)} pro / ${formatNumber(metrics.users.total)} total`}
              explanation={`Percentage of total users who have upgraded to a paid plan. Your goal is ${PRODUCT_GOALS.conversionTarget}% conversion rate.`}
              icon={<Zap size={16} />}
              goal={{
                current: parseFloat(conversionRate),
                target: PRODUCT_GOALS.conversionTarget,
                label: "Target"
              }}
              benchmark={{
                value: BENCHMARKS.conversionRate.average,
                label: "Industry Avg"
              }}
            />
          </div>
        </CollapsibleSection>

        {/* ENGAGEMENT: Active Users & Usage Consistency */}
        <CollapsibleSection
          title="Engagement Metrics"
          icon={<Activity className="text-[hsl(var(--primary))]" size={20} />}
          isExpanded={expandedSections.engagement}
          onToggle={() => toggleSection('engagement')}
          badge={metrics.engagement ? `${metrics.engagement.dau}/${metrics.engagement.mau}` : undefined}
        >
          {metrics.engagement ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                label="Daily Active Users"
                value={formatNumber(metrics.engagement.dau)}
                subtitle={`Stickiness: ${metrics.engagement.stickiness}%`}
                explanation="Users who were active today or yesterday. DAU/MAU ratio (stickiness) measures engagement quality. 25%+ is excellent."
                icon={<UserCheck size={16} />}
                benchmark={{
                  value: BENCHMARKS.stickiness.average * (metrics.engagement.mau / 100),
                  label: "Average DAU"
                }}
              />

              <MetricCard
                label="Monthly Active Users"
                value={formatNumber(metrics.engagement.mau)}
                subtitle={`${formatNumber(metrics.engagement.powerUsers)} power users`}
                explanation="Unique users active in the last 30 days. MAU indicates your active user base size."
                icon={<Users size={16} />}
              />

              <MetricCard
                label="Usage Consistency"
                value={`${metrics.engagement.avgActiveDays.toFixed(1)} days`}
                subtitle={`${formatNumber(metrics.engagement.consistentUsers)} consistent users (3+ days)`}
                explanation="Average number of active days per user in the last 30 days. Higher = more engaged users."
                icon={<Repeat size={16} />}
              />
            </div>
          ) : (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Engagement metrics loading...</p>
          )}
        </CollapsibleSection>

        {/* PRODUCT USAGE: Completion Rate & Feature Adoption */}
        <CollapsibleSection
          title="Product Usage Metrics"
          icon={<Target className="text-[hsl(var(--primary))]" size={20} />}
          isExpanded={expandedSections.product}
          onToggle={() => toggleSection('product')}
        >
          {metrics.product ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                  label="Project Completion Rate"
                  value={`${metrics.product.completionRate}%`}
                  subtitle={`${formatNumber(metrics.projects.completed)} / ${formatNumber(metrics.projects.total)} projects`}
                  explanation="Percentage of projects that reached completion status. Higher completion = better product value delivery."
                  icon={<CheckCircle size={16} />}
                  highlight={true}
                  benchmark={{
                    value: BENCHMARKS.completionRate.average,
                    label: "Average"
                  }}
                />

                <MetricCard
                  label="Projects per User"
                  value={metrics.product.avgProjectsPerUser.toFixed(1)}
                  subtitle={`${formatNumber(metrics.product.usersWithMultipleProjects)} users with multiple`}
                  explanation="Average number of projects created per user. Higher = users find value and return."
                  icon={<FileText size={16} />}
                />

                <MetricCard
                  label={`Usage (${daysFilter}d)`}
                  value={formatNumber(metrics.usage.aiWordsLast30Days)}
                  subtitle={`AI words • ${formatNumber(metrics.usage.plagiarismChecksLast30Days)} checks`}
                  trend={metrics.comparisons?.changes.aiWords}
                  explanation="Total AI-generated words and plagiarism checks in the period. Shows product utilization."
                  icon={<Activity size={16} />}
                />
              </div>

              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-[0.24em]">Feature Adoption Rates</h3>
                  <div className="relative">
                    <Info 
                      size={14} 
                      className="text-[hsl(var(--muted-foreground))] cursor-help"
                      onMouseEnter={(e) => {
                        const tooltip = document.createElement('div');
                        tooltip.className = 'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[hsl(var(--popover))] border-2 border-[hsl(var(--border-strong))] rounded-lg text-xs text-left shadow-lg';
                        tooltip.textContent = 'Percentage of projects using each feature. Higher adoption = better feature value.';
                        tooltip.id = 'feature-adoption-tooltip';
                        e.currentTarget.parentElement?.appendChild(tooltip);
                      }}
                      onMouseLeave={() => {
                        const tooltip = document.getElementById('feature-adoption-tooltip');
                        tooltip?.remove();
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Citations</span>
                      <span className="text-sm font-bold">{metrics.product.citationAdoption}%</span>
                    </div>
                    <div className="w-full bg-[hsl(var(--border-strong))] rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          parseFloat(metrics.product.citationAdoption.toString()) >= BENCHMARKS.featureAdoption.good ? 'bg-green-500' :
                          parseFloat(metrics.product.citationAdoption.toString()) >= BENCHMARKS.featureAdoption.average ? 'bg-[hsl(var(--primary))]' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${metrics.product.citationAdoption}%` }}
                      />
                    </div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      Industry avg: {BENCHMARKS.featureAdoption.average}%
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">PDF Uploads</span>
                      <span className="text-sm font-bold">{metrics.product.pdfAdoption}%</span>
                    </div>
                    <div className="w-full bg-[hsl(var(--border-strong))] rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          parseFloat(metrics.product.pdfAdoption.toString()) >= BENCHMARKS.featureAdoption.good ? 'bg-green-500' :
                          parseFloat(metrics.product.pdfAdoption.toString()) >= BENCHMARKS.featureAdoption.average ? 'bg-[hsl(var(--primary))]' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${metrics.product.pdfAdoption}%` }}
                      />
                    </div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      Industry avg: {BENCHMARKS.featureAdoption.average}%
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Plagiarism Checks</span>
                      <span className="text-sm font-bold">{metrics.product.plagiarismAdoption}%</span>
                    </div>
                    <div className="w-full bg-[hsl(var(--border-strong))] rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          parseFloat(metrics.product.plagiarismAdoption.toString()) >= BENCHMARKS.featureAdoption.good ? 'bg-green-500' :
                          parseFloat(metrics.product.plagiarismAdoption.toString()) >= BENCHMARKS.featureAdoption.average ? 'bg-[hsl(var(--primary))]' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${metrics.product.plagiarismAdoption}%` }}
                      />
                    </div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      Industry avg: {BENCHMARKS.featureAdoption.average}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Product metrics loading...</p>
          )}
        </CollapsibleSection>

        {/* MONETIZATION: ARPU & Conversion */}
        <CollapsibleSection
          title="Monetization Metrics"
          icon={<DollarSign className="text-[hsl(var(--primary))]" size={20} />}
          isExpanded={expandedSections.monetization}
          onToggle={() => toggleSection('monetization')}
        >
          {metrics.monetization ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                label="ARPU (All Users)"
                value={formatCurrency(parseFloat(metrics.monetization.arpu.toString()))}
                subtitle="Average revenue per user"
                explanation="Average revenue generated per user (including free users). Industry average is $15-30 for SaaS products."
                icon={<BarChart3 size={16} />}
                benchmark={{
                  value: BENCHMARKS.arpu.average,
                  label: "Average"
                }}
              />

              <MetricCard
                label="ARPU (Active)"
                value={formatCurrency(parseFloat(metrics.monetization.arpuActive.toString()))}
                subtitle="Per active subscription"
                explanation="Average revenue per paying subscriber. This is your core monetization metric."
                icon={<Sparkles size={16} />}
              />

              <MetricCard
                label="Time to Conversion"
                value={`${metrics.monetization.avgTimeToConversion.toFixed(1)} days`}
                subtitle="Average days to upgrade"
                explanation="Average time from signup to paid conversion. Faster = better onboarding and value delivery. Industry average: 14-30 days."
                icon={<Clock size={16} />}
                benchmark={{
                  value: BENCHMARKS.timeToConversion.average,
                  label: "Average"
                }}
              />
            </div>
          ) : (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Monetization metrics loading...</p>
          )}
        </CollapsibleSection>

        {/* RETENTION: Churn & Cohort */}
        <CollapsibleSection
          title="Retention Metrics"
          icon={<Repeat className="text-[hsl(var(--primary))]" size={20} />}
          isExpanded={expandedSections.retention}
          onToggle={() => toggleSection('retention')}
        >
          {metrics.retention ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard
                label="Churn Rate"
                value={`${metrics.retention.churnRate}%`}
                subtitle={`${formatNumber(metrics.retention.churnedUsers)} users churned`}
                explanation="Monthly churn rate: percentage of users who were active 30-60 days ago but inactive in last 30 days. Lower is better. Industry average: 5-10%."
                icon={parseFloat(metrics.retention.churnRate.toString()) > 10 ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                benchmark={{
                  value: BENCHMARKS.churnRate.average,
                  label: "Average"
                }}
              />

              <MetricCard
                label="User Retention"
                value={`${metrics.engagement ? (100 - parseFloat(metrics.retention.churnRate.toString())).toFixed(1) : '0.0'}%`}
                subtitle="Users staying active"
                explanation="Percentage of users who remain active. Inverse of churn rate. Higher retention = better product-market fit."
                icon={<TrendingUp size={16} />}
              />
            </div>
          ) : (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Retention metrics loading...</p>
          )}
        </CollapsibleSection>

        {/* USERS: Top Users & Recent Users */}
        <CollapsibleSection
          title="User Lists"
          icon={<Users className="text-[hsl(var(--primary))]" size={20} />}
          isExpanded={expandedSections.users}
          onToggle={() => toggleSection('users')}
        >
          <div className="space-y-6">
            {filteredTopUsers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-[0.24em]">Top Users by Usage</h3>
                  <select
                    value={userSortBy}
                    onChange={(e) => setUserSortBy(e.target.value as 'usage' | 'name' | 'recent')}
                    className="px-3 py-1.5 border border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] text-xs uppercase tracking-[0.24em] rounded"
                  >
                    <option value="usage">Sort by Usage</option>
                    <option value="name">Sort by Name</option>
                  </select>
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
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTopUsers.map((user, idx) => (
                        <tr key={user.userId} className="border-b border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--accent))]/5">
                          <td className="py-2 px-3 font-bold">#{idx + 1}</td>
                          <td className="py-2 px-3 font-medium">{user.name || 'N/A'}</td>
                          <td className="py-2 px-3">{user.email || 'N/A'}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              user.plan === 'pro' ? 'bg-blue-500/20 text-blue-500' :
                              user.plan === 'team' ? 'bg-purple-500/20 text-purple-500' :
                              'bg-gray-500/20 text-gray-500'
                            }`}>
                              {user.plan || 'free'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-semibold">{formatNumber(user.totalAIWords)}</td>
                          <td className="py-2 px-3 text-right">{formatNumber(user.totalPlagiarismChecks)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {filteredRecentUsers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-[0.24em]">Recent Users</h3>
                  <select
                    value={userSortBy}
                    onChange={(e) => setUserSortBy(e.target.value as 'usage' | 'name' | 'recent')}
                    className="px-3 py-1.5 border border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] text-xs uppercase tracking-[0.24em] rounded"
                  >
                    <option value="recent">Sort by Recent</option>
                    <option value="name">Sort by Name</option>
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[hsl(var(--border-strong))]">
                        <th className="text-left py-2 px-3 text-xs uppercase">Name</th>
                        <th className="text-left py-2 px-3 text-xs uppercase">Email</th>
                        <th className="text-left py-2 px-3 text-xs uppercase">Plan</th>
                        <th className="text-left py-2 px-3 text-xs uppercase">Subscription</th>
                        <th className="text-left py-2 px-3 text-xs uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecentUsers.map((user) => (
                        <tr key={user._id} className="border-b border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--accent))]/5">
                          <td className="py-2 px-3 font-medium">{user.name || 'N/A'}</td>
                          <td className="py-2 px-3">{user.email}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              user.plan === 'pro' ? 'bg-blue-500/20 text-blue-500' :
                              user.plan === 'team' ? 'bg-purple-500/20 text-purple-500' :
                              'bg-gray-500/20 text-gray-500'
                            }`}>
                              {user.plan}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {user.stripeSubscriptionId ? (
                              <span className="text-green-500">✓ Active</span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* SUBSCRIPTIONS */}
        <CollapsibleSection
          title="Subscriptions"
          icon={<CreditCard className="text-[hsl(var(--primary))]" size={20} />}
          isExpanded={expandedSections.subscriptions}
          onToggle={() => toggleSection('subscriptions')}
          badge={metrics.revenue.subscriptionDetails?.length}
        >
          {filteredSubscriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border-strong))]">
                    <th className="text-left py-2 px-3 text-xs uppercase">Status</th>
                    <th className="text-left py-2 px-3 text-xs uppercase">Email</th>
                    <th className="text-right py-2 px-3 text-xs uppercase">Amount</th>
                    <th className="text-left py-2 px-3 text-xs uppercase">Interval</th>
                    <th className="text-left py-2 px-3 text-xs uppercase">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--accent))]/5">
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          sub.status === 'active' ? 'bg-green-500/20 text-green-500' :
                          sub.status === 'canceled' ? 'bg-red-500/20 text-red-500' :
                          sub.status === 'past_due' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-gray-500/20 text-gray-500'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-2 px-3">{sub.customerEmail || 'N/A'}</td>
                      <td className="text-right py-2 px-3">{formatCurrency(sub.amount)}</td>
                      <td className="py-2 px-3">{sub.interval}</td>
                      <td className="py-2 px-3">{new Date(sub.createdAt * 1000).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No subscriptions found</p>
          )}
        </CollapsibleSection>

        {/* Refresh Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={fetchMetrics}
            className="px-6 py-2 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs font-semibold uppercase tracking-[0.24em] hover:opacity-90 transition-opacity"
          >
            Refresh Metrics
          </button>
        </div>
      </div>
    </div>
  );
}
