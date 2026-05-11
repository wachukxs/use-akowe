'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Link as LinkIcon,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Shield,
  DollarSign,
  Clock,
  CheckCircle,
  ClipboardList,
  X,
  Mail,
} from 'lucide-react';
import { getQualityScoreLabel } from '@/lib/influencer-quality';
import { useAdminAuth } from '@/components/AdminAuthGuard';
import FraudTab from './FraudTab';

interface ReferralStats {
  totalReferrals: number;
  totalInfluencers: number;
  totalUserReferrers: number;
  referralsByInfluencers: number;
  referralsByUsers: number;
}

interface Influencer {
  _id: string;
  name: string;
  email: string;
  referralCode: string;
  notes?: string;
  hasProAccess: boolean;
  referralCount: number;
  qualityScore?: number;
  activationRate?: number;
  paidConversionRate?: number;
  avgActiveDays?: number;
  qualityScoreLastCalculated?: string | Date | null;
  createdAt: string;
}

interface UserReferrer {
  _id: string;
  name: string;
  email: string;
  referralCode: string;
  plan: string;
  referralCount: number;
  createdAt: string;
}

interface ReferredUser {
  _id: string;
  name: string;
  email: string;
  plan: string;
  createdAt: string;
  referredBy: {
    type: 'user' | 'influencer';
    _id: string;
    name: string;
    email: string;
  } | null;
}

interface ReferralData {
  stats: ReferralStats;
  influencers: Influencer[];
  userReferrers: UserReferrer[];
  referredUsers: ReferredUser[];
}

interface CommissionStats {
  pendingCount: number;
  pendingTotal: string;
  paidCount: number;
  paidTotal: string;
  cancelledCount: number;
  allTimeTotal: string;
}

interface Commission {
  _id: string;
  referralCode: string;
  referrerType: 'user' | 'influencer';
  referrerName: string | null;
  referrerEmail: string | null;
  referredUserName: string | null;
  referredUserEmail: string | null;
  referredUserPlan: string | null;
  billingCycle: 'monthly' | 'annual';
  commissionMonth: number;
  billingReason: 'subscription_create' | 'subscription_cycle';
  paymentAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt: string | null;
  createdAt: string;
}

interface CommissionData {
  stats: CommissionStats;
  commissions: Commission[];
}

interface AffiliateApplicationData {
  _id: string;
  name: string;
  email: string;
  website?: string;
  promotionMethod: string;
  audienceSize?: string;
  message?: string;
  status: 'pending' | 'approved' | 'denied';
  reviewedAt?: string;
  influencerReferralCode?: string;
  alreadyInfluencer?: boolean;
  existingReferralCode?: string | null;
  alreadyUser?: boolean;
  userReferralCode?: string | null;
  createdAt: string;
}

interface ApplicationStats {
  pending: number;
  approved: number;
  denied: number;
}

interface ApplicationsResponse {
  stats: ApplicationStats;
  applications: AffiliateApplicationData[];
}

type ReferralSubSection = 'referrals' | 'fraud' | 'commissions' | 'applications';

export default function ReferralsTab() {
  const { isFullAccess } = useAdminAuth();
  const [activeSection, setActiveSection] = useState<ReferralSubSection>('referrals');
  const [data, setData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null);
  const [isLoadingCommissions, setIsLoadingCommissions] = useState(false);
  const [commissionError, setCommissionError] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showAddInfluencer, setShowAddInfluencer] = useState(false);
  const [newInfluencer, setNewInfluencer] = useState({ name: '', email: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [recalculatingQuality, setRecalculatingQuality] = useState<string | null>(null);
  const [applicationData, setApplicationData] = useState<ApplicationsResponse | null>(null);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [processingApplication, setProcessingApplication] = useState<string | null>(null);
  const [copiedAppCode, setCopiedAppCode] = useState<string | null>(null);
  const [sendingAffiliateEmail, setSendingAffiliateEmail] = useState<string | null>(null);
  const [affiliateEmailSent, setAffiliateEmailSent] = useState<string | null>(null);
  const [promotingUser, setPromotingUser] = useState<string | null>(null);
  const [userPromoted, setUserPromoted] = useState<string | null>(null);
  const [togglingProAccess, setTogglingProAccess] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const fetchReferralData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/referrals');
      if (!response.ok) {
        throw new Error('Failed to fetch referral data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCommissionData = async () => {
    try {
      setIsLoadingCommissions(true);
      setCommissionError(null);
      const response = await fetch('/api/admin/commissions');
      if (!response.ok) throw new Error('Failed to fetch commission data');
      const result = await response.json();
      setCommissionData(result);
    } catch (err) {
      setCommissionError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoadingCommissions(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    setMarkingPaid(id);
    try {
      const response = await fetch('/api/admin/commissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'paid' }),
      });
      if (!response.ok) throw new Error('Failed to update commission');
      fetchCommissionData();
    } catch (err) {
      setCommissionError(err instanceof Error ? err.message : 'Failed to update commission');
    } finally {
      setMarkingPaid(null);
    }
  };

  const handleCancelCommission = async (id: string) => {
    setMarkingPaid(id);
    try {
      const response = await fetch('/api/admin/commissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'cancelled' }),
      });
      if (!response.ok) throw new Error('Failed to update commission');
      fetchCommissionData();
    } catch (err) {
      setCommissionError(err instanceof Error ? err.message : 'Failed to update commission');
    } finally {
      setMarkingPaid(null);
    }
  };

  const fetchApplicationData = async () => {
    try {
      setIsLoadingApplications(true);
      setApplicationError(null);
      const response = await fetch('/api/admin/affiliate-applications');
      if (!response.ok) throw new Error('Failed to fetch applications');
      const result = await response.json();
      setApplicationData(result);
    } catch (err) {
      setApplicationError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessingApplication(id);
    try {
      const response = await fetch('/api/admin/affiliate-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve application');
      }
      fetchApplicationData();
    } catch (err) {
      setApplicationError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setProcessingApplication(null);
    }
  };

  const handleDeny = async (id: string) => {
    setProcessingApplication(id);
    try {
      const response = await fetch('/api/admin/affiliate-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'deny' }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to deny application');
      }
      fetchApplicationData();
    } catch (err) {
      setApplicationError(err instanceof Error ? err.message : 'Failed to deny');
    } finally {
      setProcessingApplication(null);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  useEffect(() => {
    if (activeSection === 'commissions' && !commissionData && !isLoadingCommissions) {
      fetchCommissionData();
    }
    if (activeSection === 'applications' && !applicationData && !isLoadingApplications) {
      fetchApplicationData();
    }
  }, [activeSection]);

  const copyToClipboard = async (code: string) => {
    const { buildSignupLink } = await import('@/lib/referral-links');
    const url = buildSignupLink(code, baseUrl || window.location.origin);
    await navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAddInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInfluencer.name || !newInfluencer.email) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInfluencer),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create influencer');
      }

      setNewInfluencer({ name: '', email: '', notes: '' });
      setShowAddInfluencer(false);
      fetchReferralData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create influencer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecalculateQuality = async (id: string) => {
    setRecalculatingQuality(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/influencers/${id}/quality`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to recalculate quality score');
      }
      // Refresh data after recalculation
      fetchReferralData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recalculate quality score');
    } finally {
      setRecalculatingQuality(null);
    }
  };

  const handlePromoteToInfluencer = async (id: string) => {
    setPromotingUser(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${id}/promote-to-influencer`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to promote user');
      }
      setUserPromoted(id);
      setTimeout(() => setUserPromoted(null), 3000);
      fetchReferralData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to promote user to influencer');
    } finally {
      setPromotingUser(null);
    }
  };

  const handleSendAffiliateEmail = async (id: string) => {
    setSendingAffiliateEmail(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/influencers/${id}/send-affiliate-email`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }
      setAffiliateEmailSent(id);
      setTimeout(() => setAffiliateEmailSent(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send affiliate email');
    } finally {
      setSendingAffiliateEmail(null);
    }
  };

  const handleToggleProAccess = async (id: string, currentValue: boolean) => {
    setTogglingProAccess(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/influencers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasProAccess: !currentValue }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update pro access');
      }
      fetchReferralData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pro access');
    } finally {
      setTogglingProAccess(null);
    }
  };

  const handleDeleteInfluencer = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/influencers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete influencer');
      }

      setDeleteConfirm(null);
      fetchReferralData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete influencer');
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--primary))] border-t-transparent mx-auto"></div>
          <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
            Loading referral data...
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
            onClick={fetchReferralData}
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
      {/* Sub-section Navigation */}
      <div className="flex items-center gap-2 border-b-2 border-[hsl(var(--border-strong))]">
        <button
          onClick={() => setActiveSection('referrals')}
          className={`px-3 sm:px-6 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap touch-manipulation ${
            activeSection === 'referrals'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          <LinkIcon size={14} className="sm:w-4 sm:h-4" />
          <span>Referrals</span>
        </button>
        <button
          onClick={() => setActiveSection('fraud')}
          className={`px-3 sm:px-6 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap touch-manipulation ${
            activeSection === 'fraud'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          <Shield size={14} className="sm:w-4 sm:h-4" />
          <span>Fraud Detection</span>
        </button>
        <button
          onClick={() => setActiveSection('commissions')}
          className={`px-3 sm:px-6 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap touch-manipulation ${
            activeSection === 'commissions'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          <DollarSign size={14} className="sm:w-4 sm:h-4" />
          <span>Commissions</span>
        </button>
        <button
          onClick={() => setActiveSection('applications')}
          className={`px-3 sm:px-6 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap touch-manipulation ${
            activeSection === 'applications'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          <ClipboardList size={14} className="sm:w-4 sm:h-4" />
          <span>Applications</span>
        </button>
      </div>

      {/* Content */}
      {activeSection === 'fraud' ? (
        <FraudTab />
      ) : activeSection === 'applications' ? (
        <div className="space-y-6">
          {/* Applications Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-[0.16em]">Affiliate Applications</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.24em] mt-1">
                Review and approve dedicated affiliate partner applications
              </p>
            </div>
            <button
              onClick={fetchApplicationData}
              disabled={isLoadingApplications}
              className="px-4 py-2.5 min-h-[44px] text-xs border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation"
            >
              <RefreshCw size={14} className={isLoadingApplications ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {applicationError && (
            <div className="border-2 border-[hsl(var(--destructive))] bg-[hsl(var(--surface))] p-4 rounded-lg flex items-center gap-3 text-sm text-[hsl(var(--destructive))]">
              <AlertCircle size={16} />
              {applicationError}
            </div>
          )}

          {isLoadingApplications ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--primary))] border-t-transparent mx-auto"></div>
                <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Loading applications...</p>
              </div>
            </div>
          ) : applicationData ? (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="border-2 border-yellow-500/40 bg-yellow-500/5 p-3 sm:p-4 rounded-lg">
                  <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1 flex items-center gap-1">
                    <Clock size={10} />
                    Pending
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-yellow-600">{applicationData.stats.pending}</div>
                </div>
                <div className="border-2 border-green-500/40 bg-green-500/5 p-3 sm:p-4 rounded-lg">
                  <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1 flex items-center gap-1">
                    <CheckCircle size={10} />
                    Approved
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{applicationData.stats.approved}</div>
                </div>
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
                  <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1 flex items-center gap-1">
                    <X size={10} />
                    Denied
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[hsl(var(--muted-foreground))]">{applicationData.stats.denied}</div>
                </div>
              </div>

              {/* Applications Table */}
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg overflow-hidden">
                <div className="p-3 sm:p-4 border-b border-[hsl(var(--border-strong))] flex items-center gap-2 sm:gap-3">
                  <ClipboardList className="text-[hsl(var(--primary))] sm:w-5 sm:h-5" size={18} />
                  <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em]">All Applications</h3>
                  <span className="px-2 py-0.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs font-semibold">
                    {applicationData.applications.length}
                  </span>
                </div>

                {applicationData.applications.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm min-w-[900px]">
                      <thead>
                        <tr className="border-b border-[hsl(var(--border-strong))]">
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Name</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Email</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Method</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Audience</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Website</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Applied</th>
                          <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Status</th>
                          <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applicationData.applications.map((app) => (
                          <tr
                            key={app._id}
                            className={`border-b border-[hsl(var(--border-strong))] ${
                              app.status === 'denied' ? 'opacity-50' : 'hover:bg-[hsl(var(--accent))]/5'
                            }`}
                          >
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div className="font-medium text-xs sm:text-sm">{app.name}</div>
                              {app.message && (
                                <div className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 max-w-[180px] truncate" title={app.message}>
                                  {app.message}
                                </div>
                              )}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs text-[hsl(var(--muted-foreground))] break-all">
                              {app.email}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[hsl(var(--accent))]/20 capitalize">
                                {app.promotionMethod.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs text-[hsl(var(--muted-foreground))]">
                              {app.audienceSize || '—'}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs">
                              {app.website ? (
                                <a
                                  href={app.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[hsl(var(--primary))] hover:underline max-w-[120px] block truncate"
                                  title={app.website}
                                >
                                  {app.website.replace(/^https?:\/\//, '')}
                                </a>
                              ) : '—'}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs text-[hsl(var(--muted-foreground))]">
                              {new Date(app.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                              {app.status === 'pending' && (
                                <div className="space-y-1">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-600 font-semibold block">
                                    Pending
                                  </span>
                                  {app.alreadyInfluencer && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-500/20 text-orange-600 font-semibold block" title="This email is already active in the Influencer list">
                                      Active Influencer
                                    </span>
                                  )}
                                  {app.alreadyUser && !app.alreadyInfluencer && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-600 font-semibold block" title="This person is already an Akowe user with a referral code in Settings">
                                      Akowe User
                                    </span>
                                  )}
                                </div>
                              )}
                              {app.status === 'approved' && (
                                <div className="space-y-1">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/20 text-green-600 font-semibold block">
                                    Approved
                                  </span>
                                  {app.influencerReferralCode && (
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(app.influencerReferralCode!);
                                        setCopiedAppCode(app._id);
                                        setTimeout(() => setCopiedAppCode(null), 2000);
                                      }}
                                      className="font-mono text-[10px] bg-[hsl(var(--accent))]/20 px-1.5 py-0.5 rounded hover:bg-[hsl(var(--accent))]/40 transition-colors flex items-center gap-1"
                                      title="Click to copy referral code"
                                    >
                                      {copiedAppCode === app._id ? (
                                        <>
                                          <Check size={8} className="text-green-600" />
                                          <span className="text-green-600">Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy size={8} />
                                          {app.influencerReferralCode}
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              )}
                              {app.status === 'denied' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-500/20 text-gray-500 font-semibold">
                                  Denied
                                </span>
                              )}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                              {app.status === 'pending' && (
                                <div className="flex flex-col items-center gap-1">
                                  {app.alreadyInfluencer && app.existingReferralCode && (
                                    <div className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">
                                      Influencer code:{' '}
                                      <code className="font-mono bg-[hsl(var(--accent))]/20 px-1 rounded">
                                        {app.existingReferralCode}
                                      </code>
                                    </div>
                                  )}
                                  {app.alreadyUser && !app.alreadyInfluencer && app.userReferralCode && (
                                    <div className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">
                                      User code:{' '}
                                      <code className="font-mono bg-[hsl(var(--accent))]/20 px-1 rounded">
                                        {app.userReferralCode}
                                      </code>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1 justify-center">
                                    <button
                                      onClick={() => isFullAccess && handleApprove(app._id)}
                                      disabled={!isFullAccess || processingApplication === app._id}
                                      title={
                                        !isFullAccess
                                          ? 'Read-only access'
                                          : app.alreadyInfluencer
                                          ? 'Link application to existing influencer record and resend their code'
                                          : 'Approve application'
                                      }
                                      className="px-2 py-1.5 min-h-[32px] text-[10px] sm:text-xs bg-green-500 text-white rounded hover:bg-green-600 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                      {processingApplication === app._id ? (
                                        <RefreshCw size={10} className="animate-spin" />
                                      ) : (
                                        <Check size={10} />
                                      )}
                                      {app.alreadyInfluencer ? 'Link & Resend' : 'Approve'}
                                    </button>
                                    <button
                                      onClick={() => isFullAccess && handleDeny(app._id)}
                                      disabled={!isFullAccess || processingApplication === app._id}
                                      title={!isFullAccess ? 'Read-only access' : 'Deny application'}
                                      className="px-2 py-1.5 min-h-[32px] text-[10px] sm:text-xs border border-[hsl(var(--border-strong))] rounded hover:bg-[hsl(var(--accent))]/10 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      Deny
                                    </button>
                                  </div>
                                </div>
                              )}
                              {app.status !== 'pending' && (
                                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <ClipboardList className="text-[hsl(var(--muted-foreground))] mx-auto mb-3" size={32} />
                    <p className="text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.16em]">
                      No applications yet
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                      Applications submitted via the affiliate page will appear here
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <button
                onClick={fetchApplicationData}
                className="px-6 py-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs font-semibold uppercase tracking-[0.24em] hover:opacity-90 transition-opacity"
              >
                Load Applications
              </button>
            </div>
          )}
        </div>
      ) : activeSection === 'commissions' ? (
        <div className="space-y-6">
          {/* Commissions Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-[0.16em]">Affiliate Commissions</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.24em] mt-1">
                Track and pay out affiliate commissions (30% per payment — first 12 months or lifetime of subscription, whichever is shorter)
              </p>
            </div>
            <button
              onClick={fetchCommissionData}
              disabled={isLoadingCommissions}
              className="px-4 py-2.5 min-h-[44px] text-xs border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation"
            >
              <RefreshCw size={14} className={isLoadingCommissions ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {commissionError && (
            <div className="border-2 border-[hsl(var(--destructive))] bg-[hsl(var(--surface))] p-4 rounded-lg flex items-center gap-3 text-sm text-[hsl(var(--destructive))]">
              <AlertCircle size={16} />
              {commissionError}
            </div>
          )}

          {isLoadingCommissions ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--primary))] border-t-transparent mx-auto"></div>
                <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Loading commissions...</p>
              </div>
            </div>
          ) : commissionData ? (
            <>
              {/* Commission Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
                  <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1 flex items-center gap-1">
                    <Clock size={10} />
                    Pending
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">{commissionData.stats.pendingTotal}</div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">{commissionData.stats.pendingCount} commission{commissionData.stats.pendingCount !== 1 ? 's' : ''}</div>
                </div>
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
                  <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1 flex items-center gap-1">
                    <CheckCircle size={10} />
                    Paid Out
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">{commissionData.stats.paidTotal}</div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">{commissionData.stats.paidCount} paid</div>
                </div>
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
                  <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
                    All-Time Earned
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">{commissionData.stats.allTimeTotal}</div>
                </div>
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
                  <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
                    Cancelled
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">{commissionData.stats.cancelledCount}</div>
                </div>
              </div>

              {/* Commissions Table */}
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg overflow-hidden">
                <div className="p-3 sm:p-4 border-b border-[hsl(var(--border-strong))] flex items-center gap-2 sm:gap-3">
                  <DollarSign className="text-[hsl(var(--primary))] sm:w-5 sm:h-5" size={18} />
                  <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em]">All Commissions</h3>
                  <span className="px-2 py-0.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs font-semibold">
                    {commissionData.commissions.length}
                  </span>
                </div>

                {commissionData.commissions.length > 0 ? (
                  <div className="overflow-x-auto -mx-0.5 sm:mx-0">
                    <table className="w-full text-xs sm:text-sm min-w-[900px]">
                      <thead>
                        <tr className="border-b border-[hsl(var(--border-strong))]">
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Affiliate</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Type</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Referred User</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Plan</th>
                          <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Subscriber</th>
                          <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Payment</th>
                          <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Commission (30% recurring)</th>
                          <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Month</th>
                          <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Status</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Date</th>
                          <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissionData.commissions.map((c) => (
                          <tr key={c._id} className="border-b border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--accent))]/5">
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div className="font-medium text-xs sm:text-sm">{c.referrerName ?? '—'}</div>
                              <div className="text-[10px] text-[hsl(var(--muted-foreground))] break-all">{c.referrerEmail ?? ''}</div>
                              <code className="text-[10px] bg-[hsl(var(--accent))]/20 px-1 py-0.5 rounded">{c.referralCode}</code>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${
                                c.referrerType === 'influencer'
                                  ? 'bg-orange-500/20 text-orange-500'
                                  : 'bg-blue-500/20 text-blue-500'
                              }`}>
                                {c.referrerType === 'influencer' ? 'Influencer' : 'User'}
                              </span>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div className="font-medium text-xs sm:text-sm">{c.referredUserName ?? '—'}</div>
                              <div className="text-[10px] text-[hsl(var(--muted-foreground))] break-all">{c.referredUserEmail ?? ''}</div>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${
                                  c.referredUserPlan === 'pro'
                                    ? 'bg-blue-500/20 text-blue-500'
                                    : c.referredUserPlan === 'standard'
                                    ? 'bg-cyan-500/20 text-cyan-600'
                                    : c.referredUserPlan === 'team'
                                    ? 'bg-purple-500/20 text-purple-500'
                                    : 'bg-gray-500/20 text-gray-500'
                                }`}>
                                  {c.referredUserPlan ?? 'free'}
                                </span>
                                <div className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{c.billingCycle}</div>
                              </div>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                              {c.referredUserPlan === 'pro' || c.referredUserPlan === 'team' || c.referredUserPlan === 'standard' ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-xs bg-green-500/20 text-green-600 font-semibold">
                                  Active
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-xs bg-red-500/20 text-red-500 font-semibold">
                                  Churned
                                </span>
                              )}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-center font-mono text-[10px] sm:text-xs">
                              {Number.isFinite(c.paymentAmount)
                                ? `$${(c.paymentAmount / 100).toFixed(2)}`
                                : '$0.00'}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-center font-mono font-semibold text-[10px] sm:text-xs">
                              {Number.isFinite(c.commissionAmount)
                                ? `$${(c.commissionAmount / 100).toFixed(2)}`
                                : '$0.00'}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-[10px] sm:text-xs">
                              <span className="px-1.5 py-0.5 bg-[hsl(var(--accent))]/20 rounded font-mono">
                                {c.commissionMonth}/12
                              </span>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold ${
                                c.status === 'paid'
                                  ? 'bg-green-500/20 text-green-600'
                                  : c.status === 'cancelled'
                                  ? 'bg-gray-500/20 text-gray-500'
                                  : 'bg-yellow-500/20 text-yellow-600'
                              }`}>
                                {c.status === 'paid' ? `Paid${c.paidAt ? ` ${new Date(c.paidAt).toLocaleDateString()}` : ''}` : c.status}
                              </span>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs text-[hsl(var(--muted-foreground))]">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                              {c.status === 'pending' && (
                                <div className="flex items-center gap-1 justify-center">
                                  <button
                                    onClick={() => isFullAccess && handleMarkPaid(c._id)}
                                    disabled={!isFullAccess || markingPaid === c._id}
                                    title={!isFullAccess ? 'Read-only access' : 'Mark as paid'}
                                    className="px-2 py-1.5 min-h-[32px] text-[10px] sm:text-xs bg-green-500 text-white rounded hover:bg-green-600 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                  >
                                    {markingPaid === c._id ? <RefreshCw size={10} className="animate-spin" /> : <Check size={10} />}
                                    Mark Paid
                                  </button>
                                  <button
                                    onClick={() => isFullAccess && handleCancelCommission(c._id)}
                                    disabled={!isFullAccess || markingPaid === c._id}
                                    title={!isFullAccess ? 'Read-only access' : 'Cancel commission'}
                                    className="px-2 py-1.5 min-h-[32px] text-[10px] sm:text-xs border border-[hsl(var(--border-strong))] rounded hover:bg-red-500/10 text-red-500 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                              {c.status !== 'pending' && (
                                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <DollarSign className="text-[hsl(var(--muted-foreground))] mx-auto mb-3" size={32} />
                    <p className="text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.16em]">
                      No commissions recorded yet
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                      A commission is created on every payment from a referred user — for their first 12 months or lifetime of subscription, whichever is shorter
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <button
                onClick={fetchCommissionData}
                className="px-6 py-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs font-semibold uppercase tracking-[0.24em] hover:opacity-90 transition-opacity"
              >
                Load Commissions
              </button>
            </div>
          )}
        </div>
      ) : !data ? null : (
        <>
          {/* Header with Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-[0.16em]">Referral Tracking</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.24em] mt-1">
                Track user and influencer referrals
              </p>
            </div>
            <button
              onClick={fetchReferralData}
              disabled={isLoading}
              className="px-4 py-2.5 min-h-[44px] text-xs border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
            Total Referrals
          </div>
          <div className="text-xl sm:text-2xl font-bold">{formatNumber(data.stats.totalReferrals)}</div>
        </div>
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
            By Users
          </div>
          <div className="text-xl sm:text-2xl font-bold">{formatNumber(data.stats.referralsByUsers)}</div>
        </div>
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
            By Influencers
          </div>
          <div className="text-xl sm:text-2xl font-bold">{formatNumber(data.stats.referralsByInfluencers)}</div>
        </div>
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
            User Referrers
          </div>
          <div className="text-xl sm:text-2xl font-bold">{formatNumber(data.stats.totalUserReferrers)}</div>
        </div>
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 rounded-lg">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
            Influencers
          </div>
          <div className="text-xl sm:text-2xl font-bold">{formatNumber(data.stats.totalInfluencers)}</div>
        </div>
      </div>

      {/* Influencers Section */}
      <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-[hsl(var(--border-strong))] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Users className="text-[hsl(var(--primary))] sm:w-5 sm:h-5" size={18} />
            <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em]">Influencers</h3>
            <span className="px-2 py-0.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs font-semibold">
              {data.influencers.length}
            </span>
          </div>
          <button
            onClick={() => isFullAccess && setShowAddInfluencer(!showAddInfluencer)}
            disabled={!isFullAccess}
            title={!isFullAccess ? 'Read-only access' : undefined}
            className="px-4 py-2.5 min-h-[44px] text-xs border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
          >
            <UserPlus size={14} />
            Add Influencer
          </button>
        </div>

        {showAddInfluencer && (
          <div className="p-3 sm:p-4 border-b border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))]/10">
            <form onSubmit={handleAddInfluencer} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] block mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newInfluencer.name}
                    onChange={(e) => setNewInfluencer({ ...newInfluencer, name: e.target.value })}
                    className="w-full px-3 py-2.5 min-h-[44px] border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] rounded text-sm touch-manipulation"
                    placeholder="Influencer name"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] block mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newInfluencer.email}
                    onChange={(e) => setNewInfluencer({ ...newInfluencer, email: e.target.value })}
                    className="w-full px-3 py-2.5 min-h-[44px] border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] rounded text-sm touch-manipulation"
                    placeholder="influencer@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] block mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={newInfluencer.notes}
                    onChange={(e) => setNewInfluencer({ ...newInfluencer, notes: e.target.value })}
                    className="w-full px-3 py-2.5 min-h-[44px] border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] rounded text-sm touch-manipulation"
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 min-h-[44px] text-xs border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded hover:opacity-90 transition-opacity disabled:opacity-50 touch-manipulation"
                >
                  {isSubmitting ? 'Creating...' : 'Create Influencer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddInfluencer(false)}
                  className="px-4 py-2.5 min-h-[44px] text-xs border-2 border-[hsl(var(--border-strong))] rounded hover:bg-[hsl(var(--accent))] touch-manipulation"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Influencers Table */}
        {data.influencers.length > 0 ? (
          <div className="overflow-x-auto -mx-0.5 sm:mx-0">
            <table className="w-full text-xs sm:text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-[hsl(var(--border-strong))]">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Name</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Email</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Referral Link</th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Referrals</th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Quality Score</th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Activation</th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Paid Conv.</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Notes</th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Pro Access</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Added</th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.influencers.map((influencer) => {
                  const qualityLabel = influencer.qualityScore !== undefined && influencer.qualityScore !== null
                    ? getQualityScoreLabel(influencer.qualityScore)
                    : null;

                  return (
                    <tr
                      key={influencer._id}
                      className="border-b border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--accent))]/5"
                    >
                      <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium">{influencer.name}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 break-all">{influencer.email}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <code className="text-[10px] sm:text-xs bg-[hsl(var(--accent))]/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded break-all">
                            {influencer.referralCode}
                          </code>
                          <button
                            onClick={() => copyToClipboard(influencer.referralCode)}
                            className="p-1.5 min-w-[32px] min-h-[32px] hover:bg-[hsl(var(--accent))] rounded transition-colors touch-manipulation flex items-center justify-center"
                            title="Copy referral link"
                          >
                            {copiedCode === influencer.referralCode ? (
                              <Check size={14} className="text-green-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        <span className="px-1.5 sm:px-2 py-0.5 bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] rounded text-[10px] sm:text-xs font-semibold">
                          {influencer.referralCount}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        {qualityLabel ? (
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold ${
                                qualityLabel.level === 'excellent'
                                  ? 'bg-green-500/20 text-green-600'
                                  : qualityLabel.level === 'good'
                                  ? 'bg-blue-500/20 text-blue-600'
                                  : qualityLabel.level === 'fair'
                                  ? 'bg-yellow-500/20 text-yellow-600'
                                  : 'bg-red-500/20 text-red-600'
                              }`}
                            >
                              {influencer.qualityScore?.toFixed(1)} - {qualityLabel.label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] sm:text-xs text-[hsl(var(--muted-foreground))]">—</span>
                        )}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-[10px] sm:text-xs">
                        {influencer.activationRate !== undefined &&
                        influencer.activationRate !== null &&
                        Number.isFinite(influencer.activationRate)
                          ? `${influencer.activationRate.toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-[10px] sm:text-xs">
                        {influencer.paidConversionRate !== undefined &&
                        influencer.paidConversionRate !== null &&
                        Number.isFinite(influencer.paidConversionRate)
                          ? `${influencer.paidConversionRate.toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-[hsl(var(--muted-foreground))] text-[10px] sm:text-xs break-words">
                        {influencer.notes || '—'}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        <button
                          onClick={() => isFullAccess && handleToggleProAccess(influencer._id, influencer.hasProAccess)}
                          disabled={!isFullAccess || togglingProAccess === influencer._id}
                          title={
                            !isFullAccess
                              ? 'Read-only access'
                              : influencer.hasProAccess
                              ? 'Click to revoke pro access'
                              : 'Click to grant pro access'
                          }
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation ${
                            influencer.hasProAccess
                              ? 'bg-[hsl(var(--primary))]'
                              : 'bg-[hsl(var(--border-strong))]'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                              influencer.hasProAccess ? 'translate-x-4' : 'translate-x-1'
                            } ${togglingProAccess === influencer._id ? 'animate-pulse' : ''}`}
                          />
                        </button>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs">
                        {new Date(influencer.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        {deleteConfirm === influencer._id ? (
                          <div className="flex items-center gap-1 sm:gap-2 justify-center flex-wrap">
                            <button
                              onClick={() => handleDeleteInfluencer(influencer._id)}
                              disabled={!isFullAccess}
                              className="px-2 py-1.5 min-h-[32px] text-[10px] sm:text-xs bg-red-500 text-white rounded hover:bg-red-600 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1.5 min-h-[32px] text-[10px] sm:text-xs border border-[hsl(var(--border-strong))] rounded hover:bg-[hsl(var(--accent))] touch-manipulation"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 sm:gap-2 justify-center">
                            <button
                              onClick={() => isFullAccess && handleSendAffiliateEmail(influencer._id)}
                              disabled={!isFullAccess || sendingAffiliateEmail === influencer._id}
                              title={!isFullAccess ? 'Read-only access' : 'Send affiliate welcome email with their referral code'}
                              className="p-1.5 min-w-[32px] min-h-[32px] hover:bg-[hsl(var(--accent))] rounded transition-colors touch-manipulation flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {affiliateEmailSent === influencer._id ? (
                                <Check size={14} className="text-green-500" />
                              ) : sendingAffiliateEmail === influencer._id ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                <Mail size={14} />
                              )}
                            </button>
                            {influencer.referralCount > 0 && (
                              <button
                                onClick={() => isFullAccess && handleRecalculateQuality(influencer._id)}
                                disabled={!isFullAccess || recalculatingQuality === influencer._id}
                                title={!isFullAccess ? 'Read-only access' : 'Recalculate quality score'}
                                className="p-1.5 min-w-[32px] min-h-[32px] hover:bg-[hsl(var(--accent))] rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation flex items-center justify-center"
                              >
                                <RefreshCw
                                  size={14}
                                  className={recalculatingQuality === influencer._id ? 'animate-spin' : ''}
                                />
                              </button>
                            )}
                            <button
                              onClick={() => isFullAccess && setDeleteConfirm(influencer._id)}
                              disabled={!isFullAccess}
                              title={!isFullAccess ? 'Read-only access' : 'Delete influencer'}
                              className="p-1.5 min-w-[32px] min-h-[32px] hover:bg-red-500/20 rounded transition-colors text-red-500 touch-manipulation flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Users className="text-[hsl(var(--muted-foreground))] mx-auto mb-3" size={32} />
            <p className="text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.16em] mb-2">
              No influencers added yet
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Click &quot;Add Influencer&quot; to create one
            </p>
          </div>
        )}
      </div>

      {/* User Referrers Section */}
      <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-[hsl(var(--border-strong))] flex items-center gap-2 sm:gap-3">
          <TrendingUp className="text-[hsl(var(--primary))] sm:w-5 sm:h-5" size={18} />
          <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em]">Top User Referrers</h3>
          <span className="px-2 py-0.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs font-semibold">
            {data.userReferrers.length}
          </span>
        </div>
        {data.userReferrers.length > 0 ? (
          <div className="overflow-x-auto -mx-0.5 sm:mx-0">
            <table className="w-full text-xs sm:text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-[hsl(var(--border-strong))]">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Rank</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Name</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Email</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Plan</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Referral Link</th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Referrals</th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.userReferrers.map((user, idx) => (
                  <tr
                    key={user._id}
                    className="border-b border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--accent))]/5"
                  >
                    <td className="py-2 sm:py-3 px-2 sm:px-4 font-bold">#{idx + 1}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium">{user.name}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 break-all">{user.email}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs ${
                          user.plan === 'pro'
                            ? 'bg-blue-500/20 text-blue-500'
                            : user.plan === 'standard'
                            ? 'bg-cyan-500/20 text-cyan-600'
                            : user.plan === 'team'
                            ? 'bg-purple-500/20 text-purple-500'
                            : 'bg-gray-500/20 text-gray-500'
                        }`}
                      >
                        {user.plan || 'free'}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <code className="text-[10px] sm:text-xs bg-[hsl(var(--accent))]/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded break-all">
                          {user.referralCode}
                        </code>
                        <button
                          onClick={() => copyToClipboard(user.referralCode)}
                          className="p-1.5 min-w-[32px] min-h-[32px] hover:bg-[hsl(var(--accent))] rounded transition-colors touch-manipulation flex items-center justify-center"
                          title="Copy referral link"
                        >
                          {copiedCode === user.referralCode ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                      <span className="px-1.5 sm:px-2 py-0.5 bg-green-500/20 text-green-500 rounded text-[10px] sm:text-xs font-semibold">
                        {user.referralCount}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                      <button
                        onClick={() => isFullAccess && handlePromoteToInfluencer(user._id)}
                        disabled={!isFullAccess || promotingUser === user._id}
                        title={!isFullAccess ? 'Read-only access' : 'Promote to affiliate — creates an Influencer record and sends the affiliate welcome email'}
                        className="px-2 py-1.5 min-h-[32px] text-[10px] sm:text-xs border border-[hsl(var(--border-strong))] rounded hover:bg-[hsl(var(--accent))]/10 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 mx-auto"
                      >
                        {userPromoted === user._id ? (
                          <>
                            <Check size={10} className="text-green-500" />
                            <span className="text-green-500">Done</span>
                          </>
                        ) : promotingUser === user._id ? (
                          <RefreshCw size={10} className="animate-spin" />
                        ) : (
                          <>
                            <UserPlus size={10} />
                            Promote
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <TrendingUp className="text-[hsl(var(--muted-foreground))] mx-auto mb-3" size={32} />
            <p className="text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.16em]">
              No users have made referrals yet
            </p>
          </div>
        )}
      </div>

      {/* Referred Users Section */}
      <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-[hsl(var(--border-strong))] flex items-center gap-2 sm:gap-3">
          <UserPlus className="text-[hsl(var(--primary))] sm:w-5 sm:h-5" size={18} />
          <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em]">Referred Users</h3>
          <span className="px-2 py-0.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs font-semibold">
            {data.referredUsers.length}
          </span>
        </div>
        {data.referredUsers.length > 0 ? (
          <div className="overflow-x-auto -mx-0.5 sm:mx-0">
            <table className="w-full text-xs sm:text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-[hsl(var(--border-strong))]">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Name</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Email</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Plan</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Referred By</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Type</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs uppercase">Signed Up</th>
                </tr>
              </thead>
              <tbody>
                {data.referredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--accent))]/5"
                  >
                    <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium">{user.name}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 break-all">{user.email}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs ${
                          user.plan === 'pro'
                            ? 'bg-blue-500/20 text-blue-500'
                            : user.plan === 'standard'
                            ? 'bg-cyan-500/20 text-cyan-600'
                            : user.plan === 'team'
                            ? 'bg-purple-500/20 text-purple-500'
                            : 'bg-gray-500/20 text-gray-500'
                        }`}
                      >
                        {user.plan || 'free'}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      {user.referredBy ? (
                        <span className="font-medium text-xs sm:text-sm break-all">{user.referredBy.name}</span>
                      ) : (
                        <span className="text-[10px] sm:text-xs text-[hsl(var(--muted-foreground))]">Unknown</span>
                      )}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      {user.referredBy && (
                        <span
                          className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs ${
                            user.referredBy.type === 'influencer'
                              ? 'bg-orange-500/20 text-orange-500'
                              : 'bg-blue-500/20 text-blue-500'
                          }`}
                        >
                          {user.referredBy.type === 'influencer' ? 'Influencer' : 'User'}
                        </span>
                      )}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <UserPlus className="text-[hsl(var(--muted-foreground))] mx-auto mb-3" size={32} />
            <p className="text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.16em]">
              No users have been referred yet
            </p>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
