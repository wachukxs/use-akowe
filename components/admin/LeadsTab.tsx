'use client';

import { useEffect, useState } from 'react';
import { Mail, CheckCircle, Clock, Filter, RefreshCw } from 'lucide-react';

interface Lead {
  _id: string;
  email: string;
  source: 'plagiarism' | 'import';
  variant: string;
  capturedAt: string;
  convertedAt?: string;
  userId?: string;
  metadata?: {
    charCount?: number;
    fileType?: string;
    fileName?: string;
  };
}

interface LeadStats {
  [key: string]: {
    total: number;
    converted: number;
  };
}

export default function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({});
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'plagiarism' | 'import'>('all');
  const [convertedFilter, setConvertedFilter] = useState<'all' | 'converted' | 'pending'>('all');

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('source', filter);
      if (convertedFilter === 'converted') params.set('converted', 'true');
      if (convertedFilter === 'pending') params.set('converted', 'false');

      const response = await fetch(`/api/admin/leads?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
        setStats(data.stats);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [filter, convertedFilter]);

  const getConversionRate = (source: string) => {
    const stat = stats[source];
    if (!stat || stat.total === 0) return 0;
    return Math.round((stat.converted / stat.total) * 100);
  };

  const totalLeads = Object.values(stats).reduce((acc, s) => acc + s.total, 0);
  const totalConverted = Object.values(stats).reduce((acc, s) => acc + s.converted, 0);
  const overallConversionRate = totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="text-[hsl(var(--primary))]" size={20} />
            <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Total Leads
            </span>
          </div>
          <p className="text-3xl font-bold">{totalLeads}</p>
        </div>

        <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="text-green-500" size={20} />
            <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Converted
            </span>
          </div>
          <p className="text-3xl font-bold">{totalConverted}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-1">
            {overallConversionRate}% rate
          </p>
        </div>

        <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Plagiarism Tool
            </span>
          </div>
          <p className="text-3xl font-bold">{stats.plagiarism?.total || 0}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-1">
            {getConversionRate('plagiarism')}% converted
          </p>
        </div>

        <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Import Tool
            </span>
          </div>
          <p className="text-3xl font-bold">{stats.import?.total || 0}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-1">
            {getConversionRate('import')}% converted
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[hsl(var(--muted-foreground))]" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border-[3px] border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--surface))] text-xs uppercase tracking-[0.2em]"
          >
            <option value="all">All Sources</option>
            <option value="plagiarism">Plagiarism Tool</option>
            <option value="import">Import Tool</option>
          </select>
        </div>

        <select
          value={convertedFilter}
          onChange={(e) => setConvertedFilter(e.target.value as any)}
          className="px-3 py-2 border-[3px] border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--surface))] text-xs uppercase tracking-[0.2em]"
        >
          <option value="all">All Status</option>
          <option value="converted">Converted</option>
          <option value="pending">Pending</option>
        </select>

        <button
          onClick={fetchLeads}
          className="flex items-center gap-2 px-3 py-2 border-[3px] border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--surface))] text-xs uppercase tracking-[0.2em] hover:bg-[hsl(var(--surface-muted))]"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Leads Table */}
      <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))]">
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.24em] font-semibold">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.24em] font-semibold">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.24em] font-semibold">
                  Variant
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.24em] font-semibold">
                  Captured
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.24em] font-semibold">
                  Converted
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.24em] font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                    Loading...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                    No leads found
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const capturedDate = new Date(lead.capturedAt);
                  const convertedDate = lead.convertedAt ? new Date(lead.convertedAt) : null;
                  const daysToConvert = convertedDate 
                    ? Math.round((convertedDate.getTime() - capturedDate.getTime()) / (1000 * 60 * 60 * 24))
                    : null;
                  
                  // Determine the time-to-convert display text
                  const getTimeToConvertText = () => {
                    if (daysToConvert === null) return null;
                    if (daysToConvert < 0) return 'Already converted';
                    if (daysToConvert === 0) return 'Same day';
                    return `${daysToConvert}d later`;
                  };
                  
                  return (
                    <tr key={lead._id} className="border-b border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--surface-muted))]">
                      <td className="px-4 py-3 text-xs tracking-wide">
                        {lead.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-[10px] uppercase tracking-[0.2em] border-2 border-[hsl(var(--border-strong))] rounded ${
                          lead.source === 'plagiarism' 
                            ? 'bg-blue-500/10' 
                            : 'bg-purple-500/10'
                        }`}>
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                        {lead.variant}
                      </td>
                      <td className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                        {capturedDate.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                        {convertedDate ? (
                          <div>
                            <div>{convertedDate.toLocaleDateString()}</div>
                            {getTimeToConvertText() && (
                              <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
                                {getTimeToConvertText()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[hsl(var(--muted-foreground))]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {lead.convertedAt ? (
                          <span className="flex items-center gap-2 text-green-600">
                            <CheckCircle size={14} />
                            <span className="text-[10px] uppercase tracking-[0.2em]">Converted</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                            <Clock size={14} />
                            <span className="text-[10px] uppercase tracking-[0.2em]">Pending</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {total > leads.length && (
        <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] text-center">
          Showing {leads.length} of {total} leads
        </p>
      )}
    </div>
  );
}
