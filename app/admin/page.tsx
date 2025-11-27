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
  CreditCard
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

        {/* PRIORITY METRICS: Growth & Success Indicators */}
        <CollapsibleSection
          title="Growth Metrics"
          icon={<TrendingUp className="text-[hsl(var(--primary))]" size={20} />}
          isExpanded={expandedSections.growth}
          onToggle={() => toggleSection('growth')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">New Users</span>
                <Users size={16} />
              </div>
              <div className="text-2xl font-bold">{formatNumber(metrics.users.newLast30Days)}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                in {daysFilter}d • {formatNumber(metrics.users.newLast7Days)} in 7d
              </div>
            </div>

            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">Revenue ({daysFilter}d)</span>
                <DollarSign size={16} />
              </div>
              <div className="text-2xl font-bold">{formatCurrency(metrics.revenue.revenueLast30Days)}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                Total: {formatCurrency(metrics.revenue.totalRevenue)}
              </div>
            </div>

            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--accent-foreground))]">Active Subscriptions</span>
                <CheckCircle size={16} />
              </div>
              <div className="text-2xl font-bold text-[hsl(var(--accent-foreground))]">{formatNumber(metrics.revenue.activeSubscriptions)}</div>
              <div className="text-xs text-[hsl(var(--accent-foreground))] opacity-80 mt-1">
                MRR: {formatCurrency(metrics.revenue.monthlyRecurringRevenue)}
              </div>
            </div>

            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">Conversion Rate</span>
                <Zap size={16} />
              </div>
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                {formatNumber(metrics.users.pro)} pro / {formatNumber(metrics.users.total)} total
              </div>
            </div>
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
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">Daily Active Users</span>
                  <UserCheck size={16} />
                </div>
                <div className="text-2xl font-bold">{formatNumber(metrics.engagement.dau)}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Stickiness: {metrics.engagement.stickiness}%
                </div>
              </div>

              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">Monthly Active Users</span>
                  <Users size={16} />
                </div>
                <div className="text-2xl font-bold">{formatNumber(metrics.engagement.mau)}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  {formatNumber(metrics.engagement.powerUsers)} power users
                </div>
              </div>

              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">Usage Consistency</span>
                  <Repeat size={16} />
                </div>
                <div className="text-2xl font-bold">{metrics.engagement.avgActiveDays.toFixed(1)}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Avg active days • {formatNumber(metrics.engagement.consistentUsers)} consistent users
                </div>
              </div>
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
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--accent-foreground))]">Project Completion Rate</span>
                    <CheckCircle size={16} />
                  </div>
                  <div className="text-2xl font-bold text-[hsl(var(--accent-foreground))]">{metrics.product.completionRate}%</div>
                  <div className="text-xs text-[hsl(var(--accent-foreground))] opacity-80 mt-1">
                    {formatNumber(metrics.projects.completed)} / {formatNumber(metrics.projects.total)} projects
                  </div>
                </div>

                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">Projects per User</span>
                    <FileText size={16} />
                  </div>
                  <div className="text-2xl font-bold">{metrics.product.avgProjectsPerUser.toFixed(1)}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    {formatNumber(metrics.product.usersWithMultipleProjects)} users with multiple
                  </div>
                </div>

                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">Usage ({daysFilter}d)</span>
                    <Activity size={16} />
                  </div>
                  <div className="text-2xl font-bold">{formatNumber(metrics.usage.aiWordsLast30Days)}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    AI words • {formatNumber(metrics.usage.plagiarismChecksLast30Days)} checks
                  </div>
                </div>
              </div>

              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
                <h3 className="text-sm font-bold uppercase tracking-[0.24em] mb-3">Feature Adoption Rates</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Citations</span>
                      <span className="text-sm font-bold">{metrics.product.citationAdoption}%</span>
                    </div>
                    <div className="w-full bg-[hsl(var(--border-strong))] rounded-full h-2">
                      <div 
                        className="bg-[hsl(var(--primary))] h-2 rounded-full" 
                        style={{ width: `${metrics.product.citationAdoption}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">PDF Uploads</span>
                      <span className="text-sm font-bold">{metrics.product.pdfAdoption}%</span>
                    </div>
                    <div className="w-full bg-[hsl(var(--border-strong))] rounded-full h-2">
                      <div 
                        className="bg-[hsl(var(--primary))] h-2 rounded-full" 
                        style={{ width: `${metrics.product.pdfAdoption}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Plagiarism Checks</span>
                      <span className="text-sm font-bold">{metrics.product.plagiarismAdoption}%</span>
                    </div>
                    <div className="w-full bg-[hsl(var(--border-strong))] rounded-full h-2">
                      <div 
                        className="bg-[hsl(var(--primary))] h-2 rounded-full" 
                        style={{ width: `${metrics.product.plagiarismAdoption}%` }}
                      />
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
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">ARPU (All Users)</span>
                  <BarChart3 size={16} />
                </div>
                <div className="text-2xl font-bold">{formatCurrency(metrics.monetization.arpu)}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Average revenue per user
                </div>
              </div>

              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">ARPU (Active)</span>
                  <Sparkles size={16} />
                </div>
                <div className="text-2xl font-bold">{formatCurrency(metrics.monetization.arpuActive)}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Per active subscription
                </div>
              </div>

              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">Time to Conversion</span>
                  <Clock size={16} />
                </div>
                <div className="text-2xl font-bold">{metrics.monetization.avgTimeToConversion.toFixed(1)}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Average days to upgrade
                </div>
              </div>
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
              <div className={`border-2 p-4 rounded-lg ${
                parseFloat(metrics.retention.churnRate.toString()) > 10
                  ? 'border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10'
                  : 'border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">Churn Rate</span>
                  {parseFloat(metrics.retention.churnRate.toString()) > 10 ? (
                    <AlertCircle className="text-[hsl(var(--destructive))]" size={16} />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                </div>
                <div className={`text-2xl font-bold ${
                  parseFloat(metrics.retention.churnRate.toString()) > 10
                    ? 'text-[hsl(var(--destructive))]'
                    : ''
                }`}>
                  {metrics.retention.churnRate}%
                </div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  {formatNumber(metrics.retention.churnedUsers)} users churned
                </div>
              </div>

              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">User Retention</span>
                  <TrendingUp size={16} />
                </div>
                <div className="text-2xl font-bold">
                  {metrics.engagement ? (100 - metrics.retention.churnRate).toFixed(1) : '0.0'}%
                </div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Users staying active
                </div>
              </div>
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
