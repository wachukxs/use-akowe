'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  MousePointerClick,
  RefreshCw,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

interface ActivationData {
  overall: {
    total: number;
    activated: number;
    activationRate: number;
    avgTimeToActivation: number | null;
  };
  breakdown?: {
    dimension: string;
    data: Array<{
      value: string;
      total: number;
      activated: number;
      activationRate: number;
    }>;
  };
}

interface LandingPageData {
  variant: string;
  metrics: {
    totalVisits: number;
    signedUp: number;
    signupRate: number;
    activated: number;
    activationRate: number;
    hitPaywall: number;
    paywallRate: number;
  };
  breakdown?: Array<{
    channel: string;
    toolEntryPoint: string;
    total: number;
    activated: number;
    signedUp: number;
    hitPaywall: number;
    activationRate: number;
    signupRate: number;
    paywallRate: number;
  }>;
}

export default function AttributionTab() {
  const [activationData, setActivationData] = useState<ActivationData | null>(null);
  const [landingPageData, setLandingPageData] = useState<LandingPageData | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<'channel' | 'source' | 'country' | 'toolEntryPoint'>('channel');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch activation data
      const activationResponse = await fetch(`/api/admin/activation?dimension=${selectedDimension}`);
      if (!activationResponse.ok) throw new Error('Failed to fetch activation data');
      const activation = await activationResponse.json();
      setActivationData(activation);

      // Fetch landing page data
      const landingPageResponse = await fetch('/api/admin/landing-pages');
      if (!landingPageResponse.ok) throw new Error('Failed to fetch landing page data');
      const landingPage = await landingPageResponse.json();
      setLandingPageData(landingPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDimension]);

  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercent = (num: number) => `${Math.round(num * 100) / 100}%`;
  const formatMinutes = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--primary))] border-t-transparent mx-auto"></div>
          <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
            Loading attribution data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md w-full border-2 border-[hsl(var(--destructive))] bg-[hsl(var(--surface))] p-6 text-center space-y-4 rounded-lg">
          <AlertCircle className="text-[hsl(var(--destructive))] mx-auto" size={48} />
          <h2 className="text-xl font-bold uppercase tracking-[0.16em]">Error</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs font-semibold uppercase tracking-[0.24em] hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-[0.16em]">Attribution & Activation</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.24em] mt-1">
            Track UTM parameters and user activation by channel
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="px-4 py-2.5 min-h-[44px] text-xs border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Overall Activation Metrics */}
      {activationData?.overall ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
              Total Users
            </div>
            <div className="text-xl sm:text-2xl font-bold">{formatNumber(activationData.overall.total)}</div>
          </div>
          <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
              Activated
            </div>
            <div className="text-xl sm:text-2xl font-bold">{formatNumber(activationData.overall.activated)}</div>
            <div className="text-[10px] sm:text-xs text-[hsl(var(--muted-foreground))] mt-1">
              {formatPercent(activationData.overall.activationRate)} rate
            </div>
          </div>
          <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
              Avg Time to Activate
            </div>
            <div className="text-xl sm:text-2xl font-bold">
              {formatMinutes(activationData.overall.avgTimeToActivation)}
            </div>
          </div>
          <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
              Activation Rate
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[hsl(var(--primary))]">
              {formatPercent(activationData.overall.activationRate)}
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 rounded-lg text-center">
          <Users className="text-[hsl(var(--muted-foreground))] mx-auto mb-3" size={32} />
          <p className="text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.16em]">
            No activation data available
          </p>
        </div>
      )}

      {/* Dimension Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
          Breakdown by:
        </span>
        <select
          value={selectedDimension}
          onChange={(e) => setSelectedDimension(e.target.value as any)}
          className="px-3 py-2.5 min-h-[44px] border-[3px] border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--surface))] text-xs uppercase tracking-[0.2em] touch-manipulation"
        >
          <option value="channel">Channel</option>
          <option value="source">Source (UTM)</option>
          <option value="country">Country</option>
          <option value="toolEntryPoint">Tool Entry Point</option>
        </select>
      </div>

      {/* Activation Breakdown Table */}
      {activationData?.breakdown && (
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-[hsl(var(--border-strong))] flex items-center gap-2 sm:gap-3">
            <BarChart3 className="text-[hsl(var(--primary))] sm:w-5 sm:h-5" size={18} />
            <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em]">
              Activation by {selectedDimension.charAt(0).toUpperCase() + selectedDimension.slice(1)}
            </h3>
          </div>
          {activationData.breakdown.data && activationData.breakdown.data.length > 0 ? (
            <div className="overflow-x-auto -mx-0.5 sm:mx-0">
              <table className="w-full text-xs sm:text-sm min-w-[500px]">
                <thead className="bg-[hsl(var(--muted))]">
                  <tr>
                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold uppercase tracking-[0.16em]">
                      {selectedDimension.charAt(0).toUpperCase() + selectedDimension.slice(1)}
                    </th>
                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold uppercase tracking-[0.16em]">Total</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold uppercase tracking-[0.16em]">Activated</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold uppercase tracking-[0.16em]">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {activationData.breakdown.data.map((item, idx) => (
                    <tr key={idx} className="border-b border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--accent))]/5">
                      <td className="py-2 px-2 sm:px-4 font-medium">{item.value || 'Unknown'}</td>
                      <td className="py-2 px-2 sm:px-4 text-right">{formatNumber(item.total)}</td>
                      <td className="py-2 px-2 sm:px-4 text-right">{formatNumber(item.activated)}</td>
                      <td className="py-2 px-2 sm:px-4 text-right font-semibold">
                        {formatPercent(item.activationRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <BarChart3 className="text-[hsl(var(--muted-foreground))] mx-auto mb-3" size={32} />
              <p className="text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.16em]">
                No activation data available for this dimension
              </p>
            </div>
          )}
        </div>
      )}

      {/* Landing Page Performance */}
      {landingPageData ? (
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-[hsl(var(--border-strong))] flex items-center gap-2 sm:gap-3">
            <MousePointerClick className="text-[hsl(var(--primary))] sm:w-5 sm:h-5" size={18} />
            <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em]">Landing Page Performance</h3>
          </div>
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
              <div>
                <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
                  Total Visits
                </div>
                <div className="text-lg sm:text-xl font-bold">{formatNumber(landingPageData.metrics.totalVisits)}</div>
              </div>
              <div>
                <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
                  Signups
                </div>
                <div className="text-lg sm:text-xl font-bold">{formatNumber(landingPageData.metrics.signedUp)}</div>
                <div className="text-[10px] sm:text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  {formatPercent(landingPageData.metrics.signupRate)} rate
                </div>
              </div>
              <div>
                <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
                  Activated
                </div>
                <div className="text-lg sm:text-xl font-bold">{formatNumber(landingPageData.metrics.activated)}</div>
                <div className="text-[10px] sm:text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  {formatPercent(landingPageData.metrics.activationRate)} rate
                </div>
              </div>
            </div>

            {landingPageData.breakdown && landingPageData.breakdown.length > 0 ? (
              <div className="mt-4 overflow-x-auto -mx-0.5 sm:mx-0">
                <table className="w-full text-xs sm:text-sm min-w-[600px]">
                  <thead className="bg-[hsl(var(--muted))]">
                    <tr>
                      <th className="py-2 sm:py-3 px-2 sm:px-3 text-left font-semibold uppercase tracking-[0.16em]">Channel</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-3 text-left font-semibold uppercase tracking-[0.16em]">Tool</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-3 text-right font-semibold uppercase tracking-[0.16em]">Visits</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-3 text-right font-semibold uppercase tracking-[0.16em]">Signups</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-3 text-right font-semibold uppercase tracking-[0.16em]">Activated</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-3 text-right font-semibold uppercase tracking-[0.16em]">Signup Rate</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-3 text-right font-semibold uppercase tracking-[0.16em]">Activation Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {landingPageData.breakdown.map((item, idx) => (
                      <tr key={idx} className="border-b border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--accent))]/5">
                        <td className="py-2 px-2 sm:px-3 font-medium">{item.channel || 'direct'}</td>
                        <td className="py-2 px-2 sm:px-3">{item.toolEntryPoint || 'direct'}</td>
                        <td className="py-2 px-2 sm:px-3 text-right">{formatNumber(item.total)}</td>
                        <td className="py-2 px-2 sm:px-3 text-right">{formatNumber(item.signedUp)}</td>
                        <td className="py-2 px-2 sm:px-3 text-right">{formatNumber(item.activated)}</td>
                        <td className="py-2 px-2 sm:px-3 text-right">{formatPercent(item.signupRate)}</td>
                        <td className="py-2 px-2 sm:px-3 text-right font-semibold">
                          {formatPercent(item.activationRate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <MousePointerClick className="text-[hsl(var(--muted-foreground))] mx-auto mb-3" size={32} />
                <p className="text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.16em]">
                  No landing page breakdown data available
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 rounded-lg text-center">
          <MousePointerClick className="text-[hsl(var(--muted-foreground))] mx-auto mb-3" size={32} />
          <p className="text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.16em]">
            No landing page data available
          </p>
        </div>
      )}
    </div>
  );
}
