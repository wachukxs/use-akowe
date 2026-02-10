'use client';

import { useEffect, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  Search,
} from 'lucide-react';

interface FraudAnalysis {
  overall: {
    totalClicks: number;
    convertedClicks: number;
    conversionRate: number;
  };
  suspiciousReferralCodes: Array<{
    referralCode: string;
    totalClicks: number;
    convertedClicks: number;
    uniqueIPs: number;
    conversionRate: number;
  }>;
}

interface ReferralCodeAnalysis {
  referralCode: string;
  metrics: {
    totalClicks: number;
    convertedClicks: number;
    conversionRate: number;
    uniqueIPs: number;
    uniqueUserAgents: number;
    recentClicks: number;
  };
  suspiciousIPs: Array<{
    ip: string;
    clicks: number;
  }>;
  riskLevel: 'high' | 'medium' | 'low';
}

interface IPAnalysis {
  ipAddress: string;
  metrics: {
    totalClicks: number;
    convertedClicks: number;
    differentReferralCodes: number;
    conversionRate: number;
    signupsFromIP: number;
  };
  referralCodes: string[];
  usersFromIP: Array<{
    name: string;
    email: string;
    plan: string;
    createdAt: string;
  }>;
  riskLevel: 'high' | 'medium' | 'low';
}

export default function FraudTab() {
  const [fraudData, setFraudData] = useState<FraudAnalysis | null>(null);
  const [referralCodeData, setReferralCodeData] = useState<ReferralCodeAnalysis | null>(null);
  const [ipAnalysisData, setIpAnalysisData] = useState<IPAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCode, setSearchCode] = useState('');
  const [searchIP, setSearchIP] = useState('');

  const fetchOverallFraud = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/fraud/referrals');
      if (!response.ok) throw new Error('Failed to fetch fraud data');
      const data = await response.json();
      setFraudData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReferralCodeAnalysis = async (code: string) => {
    try {
      setError(null);
      setIpAnalysisData(null);
      const response = await fetch(`/api/admin/fraud/referrals?referral_code=${encodeURIComponent(code)}`);
      if (!response.ok) throw new Error('Failed to fetch referral code analysis');
      const data = await response.json();
      setReferralCodeData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchIPAnalysis = async (ip: string) => {
    try {
      setError(null);
      setReferralCodeData(null);
      const response = await fetch(`/api/admin/fraud/referrals?ip_address=${encodeURIComponent(ip)}`);
      if (!response.ok) throw new Error('Failed to fetch IP analysis');
      const data = await response.json();
      setIpAnalysisData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchOverallFraud();
  }, []);

  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercent = (num: number) => `${Math.round(num * 100) / 100}%`;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      default:
        return 'text-green-500';
    }
  };

  const getRiskBg = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-500/20 border-red-500';
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-500';
      default:
        return 'bg-green-500/20 border-green-500';
    }
  };

  if (isLoading && !fraudData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--primary))] border-t-transparent mx-auto"></div>
          <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
            Loading fraud analysis...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-[0.16em]">Fraud Detection</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.24em] mt-1">
            Monitor suspicious referral activity
          </p>
        </div>
        <button
          onClick={fetchOverallFraud}
          disabled={isLoading}
          className="px-4 py-2.5 min-h-[44px] text-xs border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="border-2 border-[hsl(var(--destructive))] bg-[hsl(var(--surface))] p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-[hsl(var(--destructive))]" size={20} />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
        <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em] mb-3 sm:mb-4 flex items-center gap-2">
          <Search size={18} className="sm:w-5 sm:h-5 text-[hsl(var(--primary))]" />
          Analyze Specific Referral Code or IP
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] mb-2 block">
              Referral Code
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Enter referral code"
                className="flex-1 px-3 py-2.5 min-h-[44px] border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm touch-manipulation"
              />
              <button
                onClick={() => searchCode && fetchReferralCodeAnalysis(searchCode)}
                className="px-4 py-2.5 min-h-[44px] border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs font-semibold uppercase tracking-[0.2em] hover:opacity-90 touch-manipulation"
              >
                Analyze
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] mb-2 block">
              IP Address
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={searchIP}
                onChange={(e) => setSearchIP(e.target.value)}
                placeholder="Enter IP address"
                className="flex-1 px-3 py-2.5 min-h-[44px] border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm touch-manipulation"
              />
              <button
                onClick={() => searchIP && fetchIPAnalysis(searchIP)}
                className="px-4 py-2.5 min-h-[44px] border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs font-semibold uppercase tracking-[0.2em] hover:opacity-90 touch-manipulation"
              >
                Analyze
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      {fraudData ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
              Total Clicks
            </div>
            <div className="text-xl sm:text-2xl font-bold">{formatNumber(fraudData.overall.totalClicks)}</div>
          </div>
          <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
              Converted Clicks
            </div>
            <div className="text-xl sm:text-2xl font-bold">{formatNumber(fraudData.overall.convertedClicks)}</div>
          </div>
          <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
              Conversion Rate
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[hsl(var(--primary))]">
              {formatPercent(fraudData.overall.conversionRate)}
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 rounded-lg text-center">
          <Shield className="text-[hsl(var(--muted-foreground))] mx-auto mb-3" size={32} />
          <p className="text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.16em]">
            No fraud data available
          </p>
        </div>
      )}

      {/* Referral Code Analysis */}
      {referralCodeData ? (
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
          <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em] mb-3 sm:mb-4 flex items-center gap-2">
            <Shield size={18} className="sm:w-5 sm:h-5 text-[hsl(var(--primary))]" />
            Analysis: {referralCodeData.referralCode || 'IP Analysis'}
          </h3>
          
          <div className="mb-3 sm:mb-4">
            <div className={`inline-block px-3 py-1 rounded border-2 ${getRiskBg(referralCodeData.riskLevel)}`}>
              <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${getRiskColor(referralCodeData.riskLevel)}`}>
                {referralCodeData.riskLevel.toUpperCase()} RISK
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                Total Clicks
              </div>
              <div className="text-lg sm:text-xl font-bold">{formatNumber(referralCodeData.metrics.totalClicks)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                Converted
              </div>
              <div className="text-lg sm:text-xl font-bold">{formatNumber(referralCodeData.metrics.convertedClicks)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                Conversion Rate
              </div>
              <div className="text-lg sm:text-xl font-bold text-[hsl(var(--primary))]">
                {formatPercent(referralCodeData.metrics.conversionRate)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                Unique IPs
              </div>
              <div className="text-lg sm:text-xl font-bold">{formatNumber(referralCodeData.metrics.uniqueIPs)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                Unique User Agents
              </div>
              <div className="text-lg sm:text-xl font-bold">{formatNumber(referralCodeData.metrics.uniqueUserAgents)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                Recent Clicks
              </div>
              <div className="text-lg sm:text-xl font-bold">{formatNumber(referralCodeData.metrics.recentClicks)}</div>
            </div>
          </div>

          {referralCodeData.suspiciousIPs && referralCodeData.suspiciousIPs.length > 0 ? (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-[0.16em] mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-500" />
                Suspicious IPs
              </h4>
              <div className="space-y-2">
                {referralCodeData.suspiciousIPs.map((ip, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-[hsl(var(--muted))] rounded">
                    <span className="font-mono text-xs sm:text-sm break-all pr-2">{ip.ip}</span>
                    <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">{ip.clicks} clicks</span>
                  </div>
                ))}
              </div>
            </div>
          ) : referralCodeData.suspiciousIPs && referralCodeData.suspiciousIPs.length === 0 ? (
            <div className="p-4 text-center border-2 border-[hsl(var(--border-strong))] rounded-lg bg-[hsl(var(--muted))]">
              <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.16em]">
                No suspicious IPs found for this referral code
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* IP Analysis Results */}
      {ipAnalysisData ? (
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
          <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em] mb-3 sm:mb-4 flex items-center gap-2">
            <Shield size={18} className="sm:w-5 sm:h-5 text-[hsl(var(--primary))]" />
            IP Analysis: {ipAnalysisData.ipAddress}
          </h3>

          <div className="mb-3 sm:mb-4">
            <div className={`inline-block px-3 py-1 rounded border-2 ${getRiskBg(ipAnalysisData.riskLevel)}`}>
              <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${getRiskColor(ipAnalysisData.riskLevel)}`}>
                {ipAnalysisData.riskLevel.toUpperCase()} RISK
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                Total Clicks
              </div>
              <div className="text-lg sm:text-xl font-bold">{formatNumber(ipAnalysisData.metrics.totalClicks)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                Converted
              </div>
              <div className="text-lg sm:text-xl font-bold">{formatNumber(ipAnalysisData.metrics.convertedClicks)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                Conversion Rate
              </div>
              <div className="text-lg sm:text-xl font-bold text-[hsl(var(--primary))]">
                {formatPercent(ipAnalysisData.metrics.conversionRate)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                Referral Codes Used
              </div>
              <div className="text-lg sm:text-xl font-bold">{formatNumber(ipAnalysisData.metrics.differentReferralCodes)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
                Signups from IP
              </div>
              <div className={`text-lg sm:text-xl font-bold ${ipAnalysisData.metrics.signupsFromIP > 3 ? 'text-red-500' : ''}`}>
                {formatNumber(ipAnalysisData.metrics.signupsFromIP)}
              </div>
            </div>
          </div>

          {ipAnalysisData.usersFromIP && ipAnalysisData.usersFromIP.length > 0 && (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-[0.16em] mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-500" />
                Users Signed Up from This IP ({ipAnalysisData.usersFromIP.length})
              </h4>
              <div className="space-y-2">
                {ipAnalysisData.usersFromIP.map((user, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-[hsl(var(--muted))] rounded gap-1">
                    <div>
                      <span className="text-xs sm:text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 rounded bg-[hsl(var(--background))] border border-[hsl(var(--border-strong))]">
                        {user.plan}
                      </span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Suspicious Referral Codes */}
      {fraudData && fraudData.suspiciousReferralCodes && fraudData.suspiciousReferralCodes.length > 0 ? (
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-[hsl(var(--border-strong))] flex items-center gap-2 sm:gap-3">
            <AlertTriangle className="text-yellow-500 sm:w-5 sm:h-5" size={18} />
            <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em]">
              Suspicious Referral Codes ({fraudData.suspiciousReferralCodes.length})
            </h3>
          </div>
          <div className="overflow-x-auto -mx-0.5 sm:mx-0">
            <table className="w-full text-xs sm:text-sm min-w-[500px]">
              <thead className="bg-[hsl(var(--muted))]">
                <tr>
                  <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold uppercase tracking-[0.16em]">Referral Code</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold uppercase tracking-[0.16em]">Total Clicks</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold uppercase tracking-[0.16em]">Converted</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold uppercase tracking-[0.16em]">Unique IPs</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold uppercase tracking-[0.16em]">Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {fraudData.suspiciousReferralCodes.map((code, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--accent))]/5 cursor-pointer touch-manipulation"
                    onClick={() => {
                      setSearchCode(code.referralCode);
                      fetchReferralCodeAnalysis(code.referralCode);
                    }}
                  >
                    <td className="py-2 px-2 sm:px-4 font-medium font-mono text-xs sm:text-sm">{code.referralCode}</td>
                    <td className="py-2 px-2 sm:px-4 text-right">{formatNumber(code.totalClicks)}</td>
                    <td className="py-2 px-2 sm:px-4 text-right">{formatNumber(code.convertedClicks)}</td>
                    <td className="py-2 px-2 sm:px-4 text-right">{formatNumber(code.uniqueIPs)}</td>
                    <td className="py-2 px-2 sm:px-4 text-right font-semibold">
                      {formatPercent(code.conversionRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : fraudData && fraudData.suspiciousReferralCodes && fraudData.suspiciousReferralCodes.length === 0 ? (
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 rounded-lg text-center">
          <AlertTriangle className="text-green-500 mx-auto mb-3" size={32} />
          <p className="text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.16em]">
            No suspicious referral codes found
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
            All referral codes appear to be legitimate
          </p>
        </div>
      ) : null}
    </div>
  );
}
