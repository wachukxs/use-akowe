'use client';

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
  Award,
  Database,
  Shield,
  RefreshCw
} from 'lucide-react';

// Updated interface to match new structure
interface AdminMetricsResponse {
  executiveSummary: {
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    activeSubscriptions: number;
    dau: number;
    mau: number;
    stickiness: number;
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
      topUsersByUsage: Array<{
        userId: string;
        email: string;
        name: string;
        plan: string;
        totalAIWords: number;
        totalPlagiarismChecks: number;
      }>;
    };
    revenue: {
      revenueInPeriod: number;
      revenueLast7Days: number;
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
  engagement: {
    dau: number;
    mau: number;
    stickiness: number;
    powerUsers: number;
    consistentUsers: number;
    avgActiveDays: number;
  };
  productHealth: {
    completionRate: number;
    avgProjectsPerUser: number;
    usersWithMultipleProjects: number;
    citationAdoption: number;
    pdfAdoption: number;
    plagiarismAdoption: number;
    projects: {
      total: number;
      active: number;
      completed: number;
    };
  };
  retention: {
    churnRate: number;
    churnedUsers: number;
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
      activeDays?: number;
    }>;
    topUsersByUsage: Array<{
      userId: string;
      email: string;
      name: string;
      plan: string;
      totalAIWords: number;
      totalPlagiarismChecks: number;
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
  dateRange: {
    days: number;
    start: string;
    end: string;
  };
  timeContexts: {
    executiveSummary: 'current';
    periodPerformance: 'period';
    businessMetrics: 'mixed';
    engagement: 'adaptive';
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

const PRODUCT_GOALS = {
  userTarget: 1600,
  userTargetPeriodDays: 90,
  conversionTarget: 15,
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
  
  const getTrendColor = (trendValue: number) => {
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
        className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--accent))]/10 transition-colors"
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

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingSections, setLoadingSections] = useState<Record<string, boolean>>({});
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    executiveSummary: true,
    periodPerformance: true,
    businessMetrics: true,
    engagement: true,
    productHealth: false,
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

  // Fetch metrics when debounced filter changes
  useEffect(() => {
    // Cancel previous request if still in flight
    if (abortController) {
      abortController.abort();
    }

    const controller = new AbortController();
    setAbortController(controller);

    fetchHealthStatus();
    fetchMetrics(controller.signal);
    
    const interval = setInterval(() => {
      fetchHealthStatus();
      const newController = new AbortController();
      setAbortController(newController);
      fetchMetrics(newController.signal);
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [debouncedDaysFilter, debouncedCustomDateRange]);

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

  const exportUsersToCSV = (users: Array<{ userId?: string; _id?: string; email: string; name: string; plan: string; totalAIWords?: number; totalPlagiarismChecks?: number; createdAt?: string; stripeSubscriptionId?: string }>) => {
    const headers = ['Name', 'Email', 'Plan', 'AI Words', 'Plagiarism Checks', 'Created At', 'Has Subscription'];
    const rows = users.map(user => [
      user.name || 'N/A',
      user.email || 'N/A',
      user.plan || 'free',
      user.totalAIWords?.toString() || '0',
      user.totalPlagiarismChecks?.toString() || '0',
      user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
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
      
      const headers = ['Name', 'Email', 'Plan', 'AI Words Generated', 'Plagiarism Checks', 'Active Days', 'User ID'];
      const rows = data.users.map((user: any) => [
        user.name || 'N/A',
        user.email || 'N/A',
        user.plan || 'free',
        user.totalAIWords?.toString() || '0',
        user.totalPlagiarismChecks?.toString() || '0',
        user.activeDays?.toString() || '0',
        user.userId || 'N/A'
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getPeriodLabel = (days: number) => {
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
            onClick={() => {
              const controller = new AbortController();
              setAbortController(controller);
              fetchMetrics(controller.signal);
            }}
            className="px-6 py-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-[var(--radius)] text-xs font-semibold uppercase tracking-[0.24em] hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b-2 border-[hsl(var(--border-strong))]">
          <div className="flex-1">
            <h1 className="text-3xl font-bold uppercase tracking-[0.16em] mb-2">Admin Dashboard</h1>
            <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Actionable Insights & Product Metrics
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const controller = new AbortController();
                setAbortController(controller);
                fetchMetrics(controller.signal);
              }}
              disabled={isLoading}
              className="px-4 py-2 text-xs border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'Refreshing...' : 'Refresh Metrics'}
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
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
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] rounded transition-all ${
                    daysFilter === option.value && !customDateRange
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] hover:border-[hsl(var(--primary))]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <button
                onClick={() => setShowCustomPicker(!showCustomPicker)}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] rounded transition-all ${
                  customDateRange
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] hover:border-[hsl(var(--primary))]'
                }`}
              >
                <Calendar size={14} className="inline mr-1" />
                Custom
              </button>
            </div>
            {showCustomPicker && (
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
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
                      className="px-4 py-2 text-xs border-2 border-[hsl(var(--border-strong))] rounded hover:bg-[hsl(var(--accent))] whitespace-nowrap"
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
                These show your current business health (MRR, active subscriptions, DAU/MAU) regardless of the selected period.
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
                  label="Daily Active Users"
                  value={formatNumber(metrics.executiveSummary.dau)}
                  subtitle={`MAU: ${formatNumber(metrics.executiveSummary.mau)} • Stickiness: ${metrics.executiveSummary.stickiness.toFixed(1)}%`}
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
            making it easy to compare performance across different periods (e.g., "How did we do this month vs last month?"). 
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
                subtitle={`${formatNumber(metrics.periodPerformance.usage.plagiarismChecksInPeriod)} plagiarism checks`}
                trend={metrics.comparisons?.changes.aiWords}
                icon={<Activity size={16} />}
                timeContext="period"
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
            with all-time totals (total revenue, conversion rate, ARPU). Current metrics show today's health, 
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
                value={`${metrics.businessMetrics.users.conversionRate.toFixed(1)}%`}
                subtitle={`${formatNumber(metrics.businessMetrics.users.pro)} paid / ${formatNumber(metrics.businessMetrics.users.total)} total`}
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
                subtitle="Average revenue per user"
                icon={<BarChart3 size={16} />}
                timeContext="all-time"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* ENGAGEMENT */}
        <CollapsibleSection
          title="Engagement Metrics"
          icon={<Activity className="text-[hsl(var(--primary))]" size={20} />}
          isExpanded={expandedSections.engagement}
          onToggle={() => toggleSection('engagement')}
          badge={`${metrics.engagement.dau}/${metrics.engagement.mau}`}
          timeContext="adaptive"
          description="Adaptive time windows based on context"
        >
          <div className="mb-4 p-3 bg-[hsl(var(--accent))]/10 border border-[hsl(var(--border-strong))] rounded text-xs text-[hsl(var(--muted-foreground))]">
            <strong className="text-[hsl(var(--foreground))]">Why Adaptive Windows?</strong> DAU/MAU metrics use industry-standard time windows 
            (last 1-2 days for DAU, last 30 days for MAU) to ensure comparability with benchmarks. 
            However, if you select a longer period, MAU adapts to use that period instead. 
            This balances standardization with flexibility for longer-term analysis.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              label="Daily Active Users"
              value={formatNumber(metrics.engagement.dau)}
              subtitle={`Stickiness: ${metrics.engagement.stickiness.toFixed(1)}%`}
              icon={<UserCheck size={16} />}
              timeContext="adaptive"
            />
            <MetricCard
              label="Monthly Active Users"
              value={formatNumber(metrics.engagement.mau)}
              subtitle={`${formatNumber(metrics.engagement.powerUsers)} power users`}
              icon={<Users size={16} />}
              timeContext="adaptive"
            />
            <MetricCard
              label="Usage Consistency"
              value={`${metrics.engagement.avgActiveDays.toFixed(1)} days`}
              subtitle={`${formatNumber(metrics.engagement.consistentUsers)} consistent users`}
              icon={<Repeat size={16} />}
              timeContext="adaptive"
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
            (e.g., "Are users completing more projects this quarter vs last quarter?") rather than just cumulative totals.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              label="Project Completion Rate"
              value={`${metrics.productHealth.completionRate.toFixed(1)}%`}
              subtitle={`${formatNumber(metrics.productHealth.projects.completed)} / ${formatNumber(metrics.productHealth.projects.total)} projects`}
              icon={<CheckCircle size={16} />}
              timeContext="all-time"
              benchmark={{
                value: BENCHMARKS.completionRate.average,
                label: "Average"
              }}
            />
            <MetricCard
              label="Projects per User"
              value={metrics.productHealth.avgProjectsPerUser.toFixed(1)}
              subtitle={`${formatNumber(metrics.productHealth.usersWithMultipleProjects)} users with multiple`}
              icon={<FileText size={16} />}
              timeContext="all-time"
            />
            <MetricCard
              label="Citation Adoption"
              value={`${metrics.productHealth.citationAdoption.toFixed(1)}%`}
              subtitle={`PDF: ${metrics.productHealth.pdfAdoption.toFixed(1)}% • Plagiarism: ${metrics.productHealth.plagiarismAdoption.toFixed(1)}%`}
              icon={<Sparkles size={16} />}
              timeContext="all-time"
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
          description="Fixed time windows for accurate churn calculation"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <MetricCard
              label="User Retention"
              value={`${(100 - metrics.retention.churnRate).toFixed(1)}%`}
              subtitle="Users staying active"
              icon={<TrendingUp size={16} />}
              timeContext="fixed-window"
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
            {metrics.detailedLists.topUsersByUsage.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-[0.24em]">Top Users by Usage</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportUsersToCSV(metrics.detailedLists.topUsersByUsage)}
                      className="px-4 py-2 text-xs border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded hover:bg-[hsl(var(--accent))] transition-colors flex items-center gap-2"
                    >
                      <FileText size={14} />
                      Export Top 20 CSV
                    </button>
                    <button
                      onClick={exportAllUsersUsageToCSV}
                      disabled={isLoading}
                      className="px-4 py-2 text-xs border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
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
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.detailedLists.topUsersByUsage.slice(0, 10).map((user, idx) => (
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

            {metrics.detailedLists.recentUsers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-[0.24em]">Recent Users</h3>
                  <button
                    onClick={() => exportUsersToCSV(metrics.detailedLists.recentUsers.map(u => ({
                      userId: u._id,
                      email: u.email,
                      name: u.name,
                      plan: u.plan,
                      createdAt: u.createdAt,
                      stripeSubscriptionId: u.stripeSubscriptionId,
                      totalAIWords: u.totalAIWords || 0,
                      totalPlagiarismChecks: u.totalPlagiarismChecks || 0,
                    })))}
                    className="px-4 py-2 text-xs border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded hover:bg-[hsl(var(--accent))] transition-colors flex items-center gap-2"
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
                        <th className="text-right py-2 px-3 text-xs uppercase">Active Days</th>
                        <th className="text-left py-2 px-3 text-xs uppercase">Subscription</th>
                        <th className="text-left py-2 px-3 text-xs uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.detailedLists.recentUsers.slice(0, 20).map((user) => (
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
                          <td className="py-2 px-3 text-right font-semibold">{formatNumber(user.totalAIWords || 0)}</td>
                          <td className="py-2 px-3 text-right">{formatNumber(user.totalPlagiarismChecks || 0)}</td>
                          <td className="py-2 px-3 text-right">{formatNumber(user.activeDays || 0)}</td>
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

        {/* Refresh Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={() => {
              const controller = new AbortController();
              setAbortController(controller);
              fetchMetrics(controller.signal);
            }}
            className="px-6 py-2 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs font-semibold uppercase tracking-[0.24em] hover:opacity-90 transition-opacity"
          >
            Refresh Metrics
          </button>
        </div>
      </div>
    </div>
  );
}

