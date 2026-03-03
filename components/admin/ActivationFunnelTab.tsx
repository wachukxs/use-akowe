'use client';

import { useEffect, useState } from 'react';
import { Users, FileText, Sparkles, DollarSign, ArrowDown, Clock, TrendingDown, RefreshCw } from 'lucide-react';

interface FunnelStep {
  label: string;
  count: number;
  conversionFromPrev: number;
  conversionFromTop: number;
  dropOff: number;
  dropOffRate: number;
}

interface WeeklyTrend {
  week: string;
  signups: number;
  firstProject: number;
  firstOutput: number;
  subscribed: number;
}

interface FunnelData {
  funnel: FunnelStep[];
  medianTimeToActivation: number | null;
  weeklyTrend: WeeklyTrend[];
}

const STEP_ICONS = [Users, FileText, Sparkles, DollarSign];
const STEP_COLORS = [
  'bg-blue-500/10 text-blue-600 border-blue-300',
  'bg-amber-500/10 text-amber-600 border-amber-300',
  'bg-purple-500/10 text-purple-600 border-purple-300',
  'bg-green-500/10 text-green-600 border-green-300',
];
const BAR_COLORS = ['bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-green-500'];

export default function ActivationFunnelTab() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<number>(0); // 0 = all-time

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/activation-funnel?days=${period}`);
      if (!res.ok) throw new Error('Failed to fetch funnel data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin mr-2" size={20} />
        <span className="text-sm uppercase tracking-[0.16em]">Loading funnel data...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="border-2 border-red-300 bg-red-50 p-6 rounded-lg text-center">
        <p className="text-red-700 font-semibold">{error || 'No data available'}</p>
        <button onClick={fetchData} className="mt-3 text-sm underline text-red-600">
          Retry
        </button>
      </div>
    );
  }

  const { funnel, medianTimeToActivation, weeklyTrend } = data;
  const topCount = funnel[0]?.count || 1;

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold uppercase tracking-[0.12em]">Activation Funnel</h2>
        <div className="flex gap-1">
          {[
            { label: 'All', value: 0 },
            { label: '7d', value: 7 },
            { label: '30d', value: 30 },
            { label: '90d', value: 90 },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] border-2 cursor-pointer transition-colors ${
                period === opt.value
                  ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'border-[hsl(var(--border-strong))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual funnel */}
      <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg p-6">
        <div className="space-y-0">
          {funnel.map((step, i) => {
            const Icon = STEP_ICONS[i];
            const widthPercent = topCount > 0 ? Math.max((step.count / topCount) * 100, 8) : 8;
            const isLast = i === funnel.length - 1;

            return (
              <div key={step.label}>
                {/* Step row */}
                <div className="flex items-center gap-4 py-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 shrink-0 ${STEP_COLORS[i]}`}>
                    <Icon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-sm font-semibold">{step.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold tabular-nums">{step.count.toLocaleString()}</span>
                        {i > 0 && (
                          <span className="text-xs text-[hsl(var(--muted-foreground))] tabular-nums">
                            {step.conversionFromTop}% of signups
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Bar */}
                    <div className="w-full bg-[hsl(var(--muted))]/20 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[i]}`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Drop-off indicator between steps */}
                {!isLast && step.dropOff > 0 && (
                  <div className="flex items-center gap-4 py-1.5">
                    <div className="w-10 flex justify-center shrink-0">
                      <ArrowDown size={14} className="text-[hsl(var(--muted-foreground))]" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                      <TrendingDown size={12} />
                      <span className="tabular-nums">
                        {step.dropOff.toLocaleString()} dropped ({step.dropOffRate}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Median time to activation */}
        {medianTimeToActivation !== null && (
          <div className="mt-6 pt-4 border-t border-[hsl(var(--border-strong))] flex items-center gap-2 text-sm">
            <Clock size={14} className="text-[hsl(var(--muted-foreground))]" />
            <span className="text-[hsl(var(--muted-foreground))]">Median time to activation:</span>
            <span className="font-bold">
              {medianTimeToActivation < 60
                ? `${medianTimeToActivation} min`
                : medianTimeToActivation < 1440
                  ? `${Math.round(medianTimeToActivation / 60)} hrs`
                  : `${Math.round(medianTimeToActivation / 1440)} days`}
            </span>
          </div>
        )}
      </div>

      {/* Conversion summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {funnel.map((step, i) => (
          <div
            key={step.label}
            className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg p-4 text-center"
          >
            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.16em] mb-1">
              {i === 0 ? 'Total' : `Step ${i} → ${i + 1}`}
            </p>
            <p className="text-2xl font-bold tabular-nums">
              {i === 0 ? step.count.toLocaleString() : `${step.conversionFromPrev}%`}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
              {i === 0 ? 'signups' : `conversion`}
            </p>
          </div>
        ))}
      </div>

      {/* Weekly trend table */}
      {weeklyTrend.length > 0 && (
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[hsl(var(--border-strong))]">
            <h3 className="text-sm font-bold uppercase tracking-[0.12em]">Weekly Trend (Last 8 Weeks)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border-strong))] bg-[hsl(var(--muted))]/10">
                  <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.12em] text-xs">Week</th>
                  <th className="text-right px-4 py-2.5 font-semibold uppercase tracking-[0.12em] text-xs">Signups</th>
                  <th className="text-right px-4 py-2.5 font-semibold uppercase tracking-[0.12em] text-xs">1st Project</th>
                  <th className="text-right px-4 py-2.5 font-semibold uppercase tracking-[0.12em] text-xs">1st Output</th>
                  <th className="text-right px-4 py-2.5 font-semibold uppercase tracking-[0.12em] text-xs">Subscribed</th>
                  <th className="text-right px-4 py-2.5 font-semibold uppercase tracking-[0.12em] text-xs">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {weeklyTrend.map((row) => {
                  const rawConv =
                    row.signups > 0 ? (row.subscribed / row.signups) * 100 : 0;
                  const convRate = Number.isFinite(rawConv)
                    ? rawConv.toFixed(1)
                    : '0.0';
                  return (
                    <tr key={row.week} className="border-b border-[hsl(var(--border-strong))]/50 hover:bg-[hsl(var(--muted))]/5">
                      <td className="px-4 py-2.5 font-mono text-xs">{row.week}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{row.signups}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{row.firstProject}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{row.firstOutput}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{row.subscribed}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{convRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
