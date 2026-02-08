'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Zap,
  FileText,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface PaywallABData {
  summary: {
    totalUsers: number;
    upgradedUsers: number;
    projectsWithAI: number;
    usersWhoHitLimit: number;
  };
  variantA: {
    description: string;
    paywallViews: number;
    conversions: number;
    conversionRate: number;
  };
  variantB: {
    description: string;
    paywallViews: number;
    previewViews: number;
    exportAttempts: number;
    exportConversions: number;
    conversionRate: number;
  };
  note?: string;
}

interface ComparisonMetric {
  free?: number;
  paid?: number;
  difference?: number;
  differencePercent?: number;
}

interface PaidUserAnalysis {
  summary: {
    freeUsers: number;
    paidUsers: number;
    analysisDate: string;
    dateRange: {
      start: string;
      end: string;
    };
  };
  projectBehavior?: {
    averageProjectsPerUser?: ComparisonMetric;
    completionRate?: ComparisonMetric;
    averageWordCountPerProject?: ComparisonMetric;
    projectTypes?: {
      free?: Record<string, number>;
      paid?: Record<string, number>;
    };
  } | null;
  aiUsage?: {
    totalAIWords?: ComparisonMetric;
    averageWordsPerUser?: ComparisonMetric;
    averageWordsPerActiveDay?: ComparisonMetric;
    averagePlagiarismChecksPerUser?: ComparisonMetric;
    usageRate?: ComparisonMetric;
    activeDays?: { free?: number; paid?: number };
  } | null;
  featureAdoption?: {
    citations?: {
      adoptionRate?: ComparisonMetric;
      averagePerProject?: ComparisonMetric;
    };
    plagiarismChecks?: {
      adoptionRate?: ComparisonMetric;
    };
    pdfUploads?: {
      adoptionRate?: ComparisonMetric;
    };
  } | null;
  engagement?: {
    averageActiveDaysPerUser?: ComparisonMetric;
    powerUsers?: { free?: number; paid?: number; freePercent?: number; paidPercent?: number };
    consistentUsers?: { free?: number; paid?: number; freePercent?: number; paidPercent?: number };
  } | null;
  conversionPatterns?: {
    totalConversions?: number;
    averageTimeToConversion?: { days?: number; hours?: number } | null;
    averageProjectsBeforeConversion?: number | null;
    averageAIWordsBeforeConversion?: number | null;
    conversionInsights?: {
      usersWithProjectsBeforeConversion?: number;
      usersWithAIUsageBeforeConversion?: number;
      usersWithMultipleProjects?: number;
      usersWithHighAIUsage?: number;
    };
    note?: string;
  } | null;
}

function ComparisonRow({ label, free, paid, isPercent = false, formatFn }: {
  label: string;
  free?: number;
  paid?: number;
  isPercent?: boolean;
  formatFn?: (n: number) => string;
}) {
  const format = formatFn || ((n: number) => isPercent ? `${Math.round(n * 100) / 100}%` : n.toLocaleString());
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
        {label}
      </div>
      <div className="text-sm sm:text-base font-bold">
        Free: {format(free || 0)}
      </div>
      <div className="text-sm sm:text-base font-bold text-[hsl(var(--primary))]">
        Paid: {format(paid || 0)}
      </div>
    </div>
  );
}

export default function AnalyticsTab() {
  const [paywallData, setPaywallData] = useState<PaywallABData | null>(null);
  const [paidUserData, setPaidUserData] = useState<PaidUserAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'paywall' | 'paid-users'>('paywall');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch paywall A/B test data
      const paywallResponse = await fetch('/api/admin/paywall-ab');
      if (!paywallResponse.ok) {
        const errorData = await paywallResponse.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to fetch paywall A/B test data';

        // Handle unauthorized errors gracefully
        if (paywallResponse.status === 401) {
          setError('Please log in to the admin dashboard to view analytics data.');
          return; // Don't try to fetch other data if unauthorized
        }

        throw new Error(errorMessage);
      }
      const paywall = await paywallResponse.json();
      setPaywallData(paywall);

      // Fetch paid user analysis
      const paidUserResponse = await fetch('/api/admin/paid-user-analysis');
      if (!paidUserResponse.ok) {
        const errorData = await paidUserResponse.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to fetch paid user analysis';

        // Handle unauthorized errors gracefully
        if (paidUserResponse.status === 401) {
          setError('Please log in to the admin dashboard to view analytics data.');
          return;
        }

        throw new Error(errorMessage);
      }
      const paidUser = await paidUserResponse.json();
      setPaidUserData(paidUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Don't block the UI - allow partial data to show
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercent = (num: number) => `${Math.round(num * 100) / 100}%`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--primary))] border-t-transparent mx-auto"></div>
          <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
            Loading analytics data...
          </p>
        </div>
      </div>
    );
  }

  // Don't block entire UI on error - show inline error banner instead

  return (
    <div className="space-y-6">
      {/* Error Banner (if error exists) */}
      {error && (
        <div className="border-2 border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 p-4 rounded-lg flex items-start gap-4">
          <AlertCircle className="text-[hsl(var(--destructive))] flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] mb-1">Error Loading Data</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">{error}</p>
            {error.includes('log in') ? (
              <Link
                href="/admin/login"
                className="inline-block text-xs px-4 py-2 border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white rounded hover:opacity-90 transition-opacity uppercase tracking-[0.16em] font-semibold"
              >
                Go to Admin Login
              </Link>
            ) : (
              <button
                onClick={fetchData}
                className="text-xs px-4 py-2 border-2 border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))] text-white rounded hover:opacity-90 transition-opacity uppercase tracking-[0.16em] font-semibold"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-[0.16em]">Analytics & Experiments</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.24em] mt-1">
            A/B tests and user behavior analysis
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="px-4 py-2 text-xs border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-2 border-b-2 border-[hsl(var(--border-strong))]">
        <button
          onClick={() => setActiveSection('paywall')}
          className={`px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors ${
            activeSection === 'paywall'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          Paywall A/B Test
        </button>
        <button
          onClick={() => setActiveSection('paid-users')}
          className={`px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors ${
            activeSection === 'paid-users'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          Paid User Analysis
        </button>
      </div>

      {/* Paywall A/B Test Section */}
      {activeSection === 'paywall' && paywallData ? (
        <div className="space-y-4">
          {paywallData.note && (
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{paywallData.note}</p>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
                Total Users
              </div>
              <div className="text-xl sm:text-2xl font-bold">{formatNumber(paywallData.summary.totalUsers)}</div>
            </div>
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
                Upgraded
              </div>
              <div className="text-xl sm:text-2xl font-bold">{formatNumber(paywallData.summary.upgradedUsers)}</div>
            </div>
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
                Projects with AI
              </div>
              <div className="text-xl sm:text-2xl font-bold">{formatNumber(paywallData.summary.projectsWithAI)}</div>
            </div>
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
                Hit Limit
              </div>
              <div className="text-xl sm:text-2xl font-bold">{formatNumber(paywallData.summary.usersWhoHitLimit)}</div>
            </div>
          </div>

          {/* Variant Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em] mb-3 sm:mb-4">Variant A</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3 sm:mb-4">{paywallData.variantA.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-[0.2em]">Paywall Views:</span>
                  <span className="font-semibold text-sm sm:text-base">{formatNumber(paywallData.variantA.paywallViews)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-[0.2em]">Conversions:</span>
                  <span className="font-semibold text-sm sm:text-base">{formatNumber(paywallData.variantA.conversions)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-[0.2em]">Conversion Rate:</span>
                  <span className="font-semibold text-sm sm:text-base text-[hsl(var(--primary))]">
                    {formatPercent(paywallData.variantA.conversionRate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em] mb-3 sm:mb-4">Variant B</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3 sm:mb-4">{paywallData.variantB.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-[0.2em]">Paywall Views:</span>
                  <span className="font-semibold text-sm sm:text-base">{formatNumber(paywallData.variantB.paywallViews)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-[0.2em]">Preview Views:</span>
                  <span className="font-semibold text-sm sm:text-base">{formatNumber(paywallData.variantB.previewViews)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-[0.2em]">Export Attempts:</span>
                  <span className="font-semibold text-sm sm:text-base">{formatNumber(paywallData.variantB.exportAttempts)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-[0.2em]">Export Conversions:</span>
                  <span className="font-semibold text-sm sm:text-base">{formatNumber(paywallData.variantB.exportConversions)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-[0.2em]">Conversion Rate:</span>
                  <span className="font-semibold text-sm sm:text-base text-[hsl(var(--primary))]">
                    {formatPercent(paywallData.variantB.conversionRate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeSection === 'paywall' ? (
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 sm:p-12 rounded-lg">
          <div className="text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] rounded-full flex items-center justify-center">
              <BarChart3 className="text-[hsl(var(--muted-foreground))]" size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold uppercase tracking-[0.16em] mb-2">
                No Paywall A/B Test Data Yet
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 leading-relaxed">
                Paywall A/B test data will appear here once users start interacting with paywall variants.
                This requires GA4 integration or database tracking of paywall events.
              </p>
              <div className="text-left bg-[hsl(var(--surface-muted))] p-4 rounded border border-[hsl(var(--border-strong))] space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  To Enable Tracking:
                </p>
                <ul className="text-xs text-[hsl(var(--muted-foreground))] space-y-1 list-disc list-inside">
                  <li>Store paywall variant assignments in User model</li>
                  <li>Track paywall views via GA4 events with variant parameter</li>
                  <li>Track export attempts and conversions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Paid User Analysis Section */}
      {activeSection === 'paid-users' && paidUserData ? (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
                Free Users
              </div>
              <div className="text-xl sm:text-2xl font-bold">{formatNumber(paidUserData.summary.freeUsers)}</div>
            </div>
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
                Paid Users
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[hsl(var(--primary))]">
                {formatNumber(paidUserData.summary.paidUsers)}
              </div>
            </div>
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
                Date Range
              </div>
              <div className="text-xs sm:text-sm font-semibold">
                {paidUserData.summary.dateRange.start === 'all-time' ? 'All Time' : paidUserData.summary.dateRange.start}
              </div>
              <div className="text-[10px] sm:text-xs text-[hsl(var(--muted-foreground))]">
                {paidUserData.summary.dateRange.end !== 'all-time' && `to ${paidUserData.summary.dateRange.end}`}
              </div>
            </div>
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
                Analysis Date
              </div>
              <div className="text-xs sm:text-sm font-semibold">
                {new Date(paidUserData.summary.analysisDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Project Behavior */}
          {paidUserData.projectBehavior ? (
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em] mb-3 sm:mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="sm:w-5 sm:h-5 text-[hsl(var(--primary))]" />
                Project Behavior
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <ComparisonRow
                  label="Avg Projects/User"
                  free={paidUserData.projectBehavior.averageProjectsPerUser?.free}
                  paid={paidUserData.projectBehavior.averageProjectsPerUser?.paid}
                />
                <ComparisonRow
                  label="Completion Rate"
                  free={paidUserData.projectBehavior.completionRate?.free}
                  paid={paidUserData.projectBehavior.completionRate?.paid}
                  isPercent
                />
                <ComparisonRow
                  label="Avg Word Count/Project"
                  free={paidUserData.projectBehavior.averageWordCountPerProject?.free}
                  paid={paidUserData.projectBehavior.averageWordCountPerProject?.paid}
                />
              </div>
            </div>
          ) : (
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 sm:p-8 rounded-lg">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] rounded-full flex items-center justify-center">
                  <BarChart3 className="text-[hsl(var(--muted-foreground))]" size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] mb-1">
                    No Project Behavior Data
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Project behavior metrics will appear once users create and complete projects.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Usage */}
          {paidUserData.aiUsage ? (
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em] mb-3 sm:mb-4 flex items-center gap-2">
                <Zap size={18} className="sm:w-5 sm:h-5 text-[hsl(var(--primary))]" />
                AI Usage Patterns
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <ComparisonRow
                  label="Avg AI Words/User"
                  free={paidUserData.aiUsage.averageWordsPerUser?.free}
                  paid={paidUserData.aiUsage.averageWordsPerUser?.paid}
                />
                <ComparisonRow
                  label="Avg Plagiarism Checks/User"
                  free={paidUserData.aiUsage.averagePlagiarismChecksPerUser?.free}
                  paid={paidUserData.aiUsage.averagePlagiarismChecksPerUser?.paid}
                />
                <ComparisonRow
                  label="AI Usage Rate"
                  free={paidUserData.aiUsage.usageRate?.free}
                  paid={paidUserData.aiUsage.usageRate?.paid}
                  isPercent
                />
              </div>
            </div>
          ) : (
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 sm:p-8 rounded-lg">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] rounded-full flex items-center justify-center">
                  <Zap className="text-[hsl(var(--muted-foreground))]" size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] mb-1">
                    No AI Usage Data
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    AI usage patterns will appear once users start generating content and running plagiarism checks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Feature Adoption */}
          {paidUserData.featureAdoption ? (
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em] mb-3 sm:mb-4 flex items-center gap-2">
                <FileText size={18} className="sm:w-5 sm:h-5 text-[hsl(var(--primary))]" />
                Feature Adoption
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <ComparisonRow
                  label="Citation Adoption"
                  free={paidUserData.featureAdoption.citations?.adoptionRate?.free}
                  paid={paidUserData.featureAdoption.citations?.adoptionRate?.paid}
                  isPercent
                />
                <ComparisonRow
                  label="Plagiarism Check Adoption"
                  free={paidUserData.featureAdoption.plagiarismChecks?.adoptionRate?.free}
                  paid={paidUserData.featureAdoption.plagiarismChecks?.adoptionRate?.paid}
                  isPercent
                />
                <ComparisonRow
                  label="PDF Upload Adoption"
                  free={paidUserData.featureAdoption.pdfUploads?.adoptionRate?.free}
                  paid={paidUserData.featureAdoption.pdfUploads?.adoptionRate?.paid}
                  isPercent
                />
              </div>
            </div>
          ) : null}

          {/* Engagement */}
          {paidUserData.engagement ? (
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em] mb-3 sm:mb-4 flex items-center gap-2">
                <Activity size={18} className="sm:w-5 sm:h-5 text-[hsl(var(--primary))]" />
                Engagement Patterns
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <ComparisonRow
                  label="Avg Active Days/User"
                  free={paidUserData.engagement.averageActiveDaysPerUser?.free}
                  paid={paidUserData.engagement.averageActiveDaysPerUser?.paid}
                />
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                    Power Users (5+ days)
                  </div>
                  <div className="text-sm sm:text-base font-bold">
                    Free: {formatNumber(paidUserData.engagement.powerUsers?.free || 0)} ({paidUserData.engagement.powerUsers?.freePercent || 0}%)
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[hsl(var(--primary))]">
                    Paid: {formatNumber(paidUserData.engagement.powerUsers?.paid || 0)} ({paidUserData.engagement.powerUsers?.paidPercent || 0}%)
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                    Consistent Users (3+ days)
                  </div>
                  <div className="text-sm sm:text-base font-bold">
                    Free: {formatNumber(paidUserData.engagement.consistentUsers?.free || 0)} ({paidUserData.engagement.consistentUsers?.freePercent || 0}%)
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[hsl(var(--primary))]">
                    Paid: {formatNumber(paidUserData.engagement.consistentUsers?.paid || 0)} ({paidUserData.engagement.consistentUsers?.paidPercent || 0}%)
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Conversion Patterns */}
          {paidUserData.conversionPatterns && paidUserData.conversionPatterns.totalConversions ? (
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em] mb-3 sm:mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="sm:w-5 sm:h-5 text-[hsl(var(--primary))]" />
                Conversion Patterns
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                    Total Conversions
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[hsl(var(--primary))]">
                    {formatNumber(paidUserData.conversionPatterns.totalConversions || 0)}
                  </div>
                </div>
                {paidUserData.conversionPatterns.averageTimeToConversion && (
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                      Avg Time to Convert
                    </div>
                    <div className="text-xl sm:text-2xl font-bold">
                      {paidUserData.conversionPatterns.averageTimeToConversion.days?.toFixed(1)}d
                    </div>
                  </div>
                )}
                {paidUserData.conversionPatterns.averageProjectsBeforeConversion != null && (
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                      Avg Projects Before Converting
                    </div>
                    <div className="text-xl sm:text-2xl font-bold">
                      {paidUserData.conversionPatterns.averageProjectsBeforeConversion}
                    </div>
                  </div>
                )}
                {paidUserData.conversionPatterns.averageAIWordsBeforeConversion != null && (
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                      Avg AI Words Before Converting
                    </div>
                    <div className="text-xl sm:text-2xl font-bold">
                      {formatNumber(paidUserData.conversionPatterns.averageAIWordsBeforeConversion)}
                    </div>
                  </div>
                )}
              </div>
              {paidUserData.conversionPatterns.conversionInsights && (
                <div className="mt-4 pt-4 border-t border-[hsl(var(--border-strong))]">
                  <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-2">
                    Conversion Insights
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="text-xs">
                      <span className="text-[hsl(var(--muted-foreground))]">Had projects: </span>
                      <span className="font-semibold">{paidUserData.conversionPatterns.conversionInsights.usersWithProjectsBeforeConversion || 0}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-[hsl(var(--muted-foreground))]">Used AI: </span>
                      <span className="font-semibold">{paidUserData.conversionPatterns.conversionInsights.usersWithAIUsageBeforeConversion || 0}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-[hsl(var(--muted-foreground))]">Multiple projects: </span>
                      <span className="font-semibold">{paidUserData.conversionPatterns.conversionInsights.usersWithMultipleProjects || 0}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-[hsl(var(--muted-foreground))]">High AI usage: </span>
                      <span className="font-semibold">{paidUserData.conversionPatterns.conversionInsights.usersWithHighAIUsage || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : paidUserData.conversionPatterns?.note ? (
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em] mb-2 flex items-center gap-2">
                <TrendingUp size={18} className="sm:w-5 sm:h-5 text-[hsl(var(--primary))]" />
                Conversion Patterns
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{paidUserData.conversionPatterns.note}</p>
            </div>
          ) : null}
        </div>
      ) : activeSection === 'paid-users' ? (
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 sm:p-12 rounded-lg">
          <div className="text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] rounded-full flex items-center justify-center">
              <Users className="text-[hsl(var(--muted-foreground))]" size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold uppercase tracking-[0.16em] mb-2">
                No Paid User Analysis Data Yet
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 leading-relaxed">
                Paid user analysis will appear here once you have users with both free and paid plans.
                The analysis compares behavior patterns between free and paid users.
              </p>
              <div className="text-left bg-[hsl(var(--surface-muted))] p-4 rounded border border-[hsl(var(--border-strong))] space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  Analysis Includes:
                </p>
                <ul className="text-xs text-[hsl(var(--muted-foreground))] space-y-1 list-disc list-inside">
                  <li>Project creation and completion rates</li>
                  <li>AI usage patterns and frequency</li>
                  <li>Feature adoption differences</li>
                  <li>Engagement and retention metrics</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
