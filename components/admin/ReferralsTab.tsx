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
  ExternalLink,
} from 'lucide-react';

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
  referralCount: number;
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

export default function ReferralsTab() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showAddInfluencer, setShowAddInfluencer] = useState(false);
  const [newInfluencer, setNewInfluencer] = useState({ name: '', email: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  useEffect(() => {
    fetchReferralData();
  }, []);

  const copyToClipboard = async (code: string) => {
    const url = `${baseUrl}/auth/signup?ref=${code}`;
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

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-[0.16em]">Referral Tracking</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.24em] mt-1">
            Track user and influencer referrals
          </p>
        </div>
        <button
          onClick={fetchReferralData}
          disabled={isLoading}
          className="px-4 py-2 text-xs border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
          <div className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
            Total Referrals
          </div>
          <div className="text-2xl font-bold">{formatNumber(data.stats.totalReferrals)}</div>
        </div>
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
          <div className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
            By Users
          </div>
          <div className="text-2xl font-bold">{formatNumber(data.stats.referralsByUsers)}</div>
        </div>
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
          <div className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
            By Influencers
          </div>
          <div className="text-2xl font-bold">{formatNumber(data.stats.referralsByInfluencers)}</div>
        </div>
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
          <div className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
            User Referrers
          </div>
          <div className="text-2xl font-bold">{formatNumber(data.stats.totalUserReferrers)}</div>
        </div>
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
          <div className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-1">
            Influencers
          </div>
          <div className="text-2xl font-bold">{formatNumber(data.stats.totalInfluencers)}</div>
        </div>
      </div>

      {/* Influencers Section */}
      <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[hsl(var(--border-strong))] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="text-[hsl(var(--primary))]" size={20} />
            <h3 className="text-lg font-bold uppercase tracking-[0.16em]">Influencers</h3>
            <span className="px-2 py-0.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs font-semibold">
              {data.influencers.length}
            </span>
          </div>
          <button
            onClick={() => setShowAddInfluencer(!showAddInfluencer)}
            className="px-4 py-2 text-xs border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <UserPlus size={14} />
            Add Influencer
          </button>
        </div>

        {/* Add Influencer Form */}
        {showAddInfluencer && (
          <div className="p-4 border-b border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))]/10">
            <form onSubmit={handleAddInfluencer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] block mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newInfluencer.name}
                    onChange={(e) => setNewInfluencer({ ...newInfluencer, name: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] rounded text-sm"
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
                    className="w-full px-3 py-2 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] rounded text-sm"
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
                    className="w-full px-3 py-2 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] rounded text-sm"
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Influencer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddInfluencer(false)}
                  className="px-4 py-2 text-xs border-2 border-[hsl(var(--border-strong))] rounded hover:bg-[hsl(var(--accent))]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Influencers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border-strong))]">
                <th className="text-left py-3 px-4 text-xs uppercase">Name</th>
                <th className="text-left py-3 px-4 text-xs uppercase">Email</th>
                <th className="text-left py-3 px-4 text-xs uppercase">Referral Link</th>
                <th className="text-center py-3 px-4 text-xs uppercase">Referrals</th>
                <th className="text-left py-3 px-4 text-xs uppercase">Notes</th>
                <th className="text-left py-3 px-4 text-xs uppercase">Added</th>
                <th className="text-center py-3 px-4 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.influencers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[hsl(var(--muted-foreground))]">
                    No influencers added yet. Click "Add Influencer" to create one.
                  </td>
                </tr>
              ) : (
                data.influencers.map((influencer) => (
                  <tr
                    key={influencer._id}
                    className="border-b border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--accent))]/5"
                  >
                    <td className="py-3 px-4 font-medium">{influencer.name}</td>
                    <td className="py-3 px-4">{influencer.email}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-[hsl(var(--accent))]/20 px-2 py-1 rounded">
                          {influencer.referralCode}
                        </code>
                        <button
                          onClick={() => copyToClipboard(influencer.referralCode)}
                          className="p-1 hover:bg-[hsl(var(--accent))] rounded transition-colors"
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
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] rounded text-xs font-semibold">
                        {influencer.referralCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[hsl(var(--muted-foreground))] text-xs">
                      {influencer.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {new Date(influencer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {deleteConfirm === influencer._id ? (
                        <div className="flex items-center gap-2 justify-center">
                          <button
                            onClick={() => handleDeleteInfluencer(influencer._id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 text-xs border border-[hsl(var(--border-strong))] rounded hover:bg-[hsl(var(--accent))]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(influencer._id)}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors text-red-500"
                          title="Delete influencer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Referrers Section */}
      <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[hsl(var(--border-strong))] flex items-center gap-3">
          <TrendingUp className="text-[hsl(var(--primary))]" size={20} />
          <h3 className="text-lg font-bold uppercase tracking-[0.16em]">Top User Referrers</h3>
          <span className="px-2 py-0.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs font-semibold">
            {data.userReferrers.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border-strong))]">
                <th className="text-left py-3 px-4 text-xs uppercase">Rank</th>
                <th className="text-left py-3 px-4 text-xs uppercase">Name</th>
                <th className="text-left py-3 px-4 text-xs uppercase">Email</th>
                <th className="text-left py-3 px-4 text-xs uppercase">Plan</th>
                <th className="text-left py-3 px-4 text-xs uppercase">Referral Link</th>
                <th className="text-center py-3 px-4 text-xs uppercase">Referrals</th>
              </tr>
            </thead>
            <tbody>
              {data.userReferrers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[hsl(var(--muted-foreground))]">
                    No users have made referrals yet.
                  </td>
                </tr>
              ) : (
                data.userReferrers.map((user, idx) => (
                  <tr
                    key={user._id}
                    className="border-b border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--accent))]/5"
                  >
                    <td className="py-3 px-4 font-bold">#{idx + 1}</td>
                    <td className="py-3 px-4 font-medium">{user.name}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          user.plan === 'pro'
                            ? 'bg-blue-500/20 text-blue-500'
                            : user.plan === 'team'
                            ? 'bg-purple-500/20 text-purple-500'
                            : 'bg-gray-500/20 text-gray-500'
                        }`}
                      >
                        {user.plan || 'free'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-[hsl(var(--accent))]/20 px-2 py-1 rounded">
                          {user.referralCode}
                        </code>
                        <button
                          onClick={() => copyToClipboard(user.referralCode)}
                          className="p-1 hover:bg-[hsl(var(--accent))] rounded transition-colors"
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
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-500 rounded text-xs font-semibold">
                        {user.referralCount}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referred Users Section */}
      <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[hsl(var(--border-strong))] flex items-center gap-3">
          <LinkIcon className="text-[hsl(var(--primary))]" size={20} />
          <h3 className="text-lg font-bold uppercase tracking-[0.16em]">Referred Users</h3>
          <span className="px-2 py-0.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs font-semibold">
            {data.referredUsers.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border-strong))]">
                <th className="text-left py-3 px-4 text-xs uppercase">Name</th>
                <th className="text-left py-3 px-4 text-xs uppercase">Email</th>
                <th className="text-left py-3 px-4 text-xs uppercase">Plan</th>
                <th className="text-left py-3 px-4 text-xs uppercase">Referred By</th>
                <th className="text-left py-3 px-4 text-xs uppercase">Type</th>
                <th className="text-left py-3 px-4 text-xs uppercase">Signed Up</th>
              </tr>
            </thead>
            <tbody>
              {data.referredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[hsl(var(--muted-foreground))]">
                    No users have signed up via referral yet.
                  </td>
                </tr>
              ) : (
                data.referredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--accent))]/5"
                  >
                    <td className="py-3 px-4 font-medium">{user.name}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          user.plan === 'pro'
                            ? 'bg-blue-500/20 text-blue-500'
                            : user.plan === 'team'
                            ? 'bg-purple-500/20 text-purple-500'
                            : 'bg-gray-500/20 text-gray-500'
                        }`}
                      >
                        {user.plan || 'free'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.referredBy ? (
                        <span className="font-medium">{user.referredBy.name}</span>
                      ) : (
                        <span className="text-[hsl(var(--muted-foreground))]">Unknown</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {user.referredBy && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            user.referredBy.type === 'influencer'
                              ? 'bg-orange-500/20 text-orange-500'
                              : 'bg-blue-500/20 text-blue-500'
                          }`}
                        >
                          {user.referredBy.type === 'influencer' ? 'Influencer' : 'User'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
