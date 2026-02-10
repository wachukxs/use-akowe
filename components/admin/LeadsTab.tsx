'use client';

import { useEffect, useState, useCallback } from 'react';
import { Mail, CheckCircle, Clock, Filter, RefreshCw, Search, X, Calendar } from 'lucide-react';

interface Lead {
  _id: string;
  email: string;
  source: 'plagiarism' | 'import' | 'topic';
  variant: string;
  capturedAt: string;
  convertedAt?: string;
  userId?: string;
  metadata?: {
    charCount?: number;
    fileType?: string;
    fileName?: string;
    topic?: string;
    projectType?: string;
    methodology?: string;
    uniquenessScore?: number;
    readinessScore?: number;
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
  const [filter, setFilter] = useState<'all' | 'plagiarism' | 'import' | 'topic'>('all');
  const [convertedFilter, setConvertedFilter] = useState<'all' | 'converted' | 'pending'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Validate date range on client side
  const validateDateRange = useCallback(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return; // Invalid dates, let API handle error
      }
      
      // If start is after end, clear end date (don't auto-swap to avoid confusion)
      if (start > end) {
        setEndDate('');
      }
    }
  }, [startDate, endDate]);

  useEffect(() => {
    validateDateRange();
  }, [validateDateRange]);

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
  };

  const exportEmailsToCSV = () => {
    if (leads.length === 0) return;

    const uniqueEmails = Array.from(
      new Set(
        leads
          .map((lead) => lead.email?.trim())
          .filter((email): email is string => Boolean(email))
      )
    );

    const csvContent = ['Email', ...uniqueEmails.map((email) => `"${email.replace(/"/g, '""')}"`)].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().split('T')[0];
    const sourcePart = filter === 'all' ? 'all-sources' : filter;
    const statusPart = convertedFilter === 'all' ? 'all-status' : convertedFilter;
    
    // Sanitize date parts for filename
    const datePart = startDate && endDate 
      ? `_${startDate.replace(/-/g, '')}_to_${endDate.replace(/-/g, '')}` 
      : '';
    
    // Sanitize search query for filename (remove special characters)
    const searchPart = debouncedSearch 
      ? `_search-${debouncedSearch.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '_')}` 
      : '';
    
    const filename = `leads-${sourcePart}-${statusPart}${datePart}${searchPart}-${dateStr}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('source', filter);
      if (convertedFilter === 'converted') params.set('converted', 'true');
      if (convertedFilter === 'pending') params.set('converted', 'false');
      
      // Add date filters (validate format first)
      if (startDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
          setError('Invalid start date format');
          setIsLoading(false);
          return;
        }
        params.set('startDate', startDate);
      }
      if (endDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
          setError('Invalid end date format');
          setIsLoading(false);
          return;
        }
        params.set('endDate', endDate);
      }
      
      // Validate date range
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
          setError('Start date must be before or equal to end date');
          setIsLoading(false);
          return;
        }
      }
      
      // Add search filter (only if not empty and within length limit)
      if (debouncedSearch && debouncedSearch.trim().length > 0) {
        const trimmed = debouncedSearch.trim();
        if (trimmed.length > 100) {
          setError('Search query is too long. Maximum 100 characters.');
          setIsLoading(false);
          return;
        }
        params.set('search', trimmed);
      }

      const response = await fetch(`/api/admin/leads?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
        setStats(data.stats);
        setTotal(data.total);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch leads' }));
        setError(errorData.error || 'Failed to fetch leads');
        console.error('Failed to fetch leads:', response.status, errorData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching leads';
      setError(errorMessage);
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [filter, convertedFilter, startDate, endDate, debouncedSearch]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Mail className="text-[hsl(var(--primary))] sm:w-5 sm:h-5" size={18} />
            <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Total Leads
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{totalLeads}</p>
        </div>

        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <CheckCircle className="text-green-500 sm:w-5 sm:h-5" size={18} />
            <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Converted
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{totalConverted}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-1">
            {overallConversionRate}% rate
          </p>
        </div>

        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Plagiarism Tool
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{stats.plagiarism?.total || 0}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-1">
            {getConversionRate('plagiarism')}% converted
          </p>
        </div>

        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Import Tool
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{stats.import?.total || 0}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-1">
            {getConversionRate('import')}% converted
          </p>
        </div>

        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Topic Finder
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{stats.topic?.total || 0}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-1">
            {getConversionRate('topic')}% converted
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3 sm:space-y-4">
        {/* First Row: Source, Status, Search */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[hsl(var(--muted-foreground))]" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="flex-1 sm:flex-none px-3 py-2.5 min-h-[44px] border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-xs uppercase tracking-[0.2em] touch-manipulation"
            >
              <option value="all">All Sources</option>
              <option value="plagiarism">Plagiarism Tool</option>
              <option value="import">Import Tool</option>
              <option value="topic">Topic Finder</option>
            </select>
          </div>

          <select
            value={convertedFilter}
            onChange={(e) => setConvertedFilter(e.target.value as any)}
            className="flex-1 sm:flex-none px-3 py-2.5 min-h-[44px] border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-xs uppercase tracking-[0.2em] touch-manipulation"
          >
            <option value="all">All Status</option>
            <option value="converted">Converted</option>
            <option value="pending">Pending</option>
          </select>

          {/* Search Input */}
          <div className="relative flex items-center gap-2 flex-1">
            <Search size={16} className="text-[hsl(var(--muted-foreground))] absolute left-3" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 pl-9 pr-8 py-2.5 min-h-[44px] border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-xs uppercase tracking-[0.1em] focus:outline-none focus:border-[hsl(var(--primary))] touch-manipulation"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2 p-1.5 min-w-[32px] min-h-[32px] hover:bg-[hsl(var(--surface-muted))] rounded touch-manipulation flex items-center justify-center"
                aria-label="Clear search"
              >
                <X size={14} className="text-[hsl(var(--muted-foreground))]" />
              </button>
            )}
          </div>

          <button
            onClick={fetchLeads}
            className="flex items-center justify-center gap-2 px-3 py-2.5 min-h-[44px] border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-xs uppercase tracking-[0.2em] hover:bg-[hsl(var(--surface-muted))] touch-manipulation"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={exportEmailsToCSV}
            disabled={isLoading || leads.length === 0}
            className="flex items-center justify-center gap-2 px-3 py-2.5 min-h-[44px] border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-xs uppercase tracking-[0.2em] hover:bg-[hsl(var(--surface-muted))] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <span className="text-[10px] uppercase tracking-[0.24em]">Export CSV</span>
          </button>
        </div>

        {/* Second Row: Date Range Filter */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[hsl(var(--muted-foreground))]" />
            <span className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              Date Range:
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                // Validate end date is not before start date
                if (endDate && e.target.value && new Date(e.target.value) > new Date(endDate)) {
                  setEndDate('');
                }
              }}
              max={endDate || new Date().toISOString().split('T')[0]}
              className="flex-1 sm:flex-none px-3 py-2.5 min-h-[44px] border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-xs uppercase tracking-[0.1em] focus:outline-none focus:border-[hsl(var(--primary))] touch-manipulation"
            />
            <span className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] text-center sm:text-left">
              to
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                // Validate start date is not after end date
                if (startDate && e.target.value && new Date(startDate) > new Date(e.target.value)) {
                  setStartDate('');
                }
              }}
              min={startDate || ''}
              max={new Date().toISOString().split('T')[0]}
              className="flex-1 sm:flex-none px-3 py-2.5 min-h-[44px] border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-xs uppercase tracking-[0.1em] focus:outline-none focus:border-[hsl(var(--primary))] touch-manipulation"
            />
            {(startDate || endDate) && (
              <button
                onClick={clearDateFilter}
                className="flex items-center justify-center gap-1 px-2 py-1.5 min-h-[44px] border-[2px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-[10px] uppercase tracking-[0.2em] hover:bg-[hsl(var(--surface-muted))] touch-manipulation"
                aria-label="Clear date filter"
              >
                <X size={12} />
                Clear
              </button>
            )}
          </div>
          {(startDate || endDate) && (
            <span className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
              {startDate && endDate
                ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                : startDate
                ? `From ${new Date(startDate).toLocaleDateString()}`
                : `Until ${new Date(endDate).toLocaleDateString()}`}
            </span>
          )}
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 border-[2px] border-red-300 bg-red-50 rounded text-xs uppercase tracking-[0.14em] text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--primary))] border-t-transparent mx-auto mb-3"></div>
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              Loading leads...
            </p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="text-[hsl(var(--muted-foreground))] mx-auto mb-3" size={32} />
            <p className="text-sm uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-1">
              {debouncedSearch || startDate || endDate
                ? 'No leads found matching your filters'
                : 'No leads found'}
            </p>
            {debouncedSearch || startDate || endDate ? (
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                Try adjusting your filters or date range
              </p>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-0.5 sm:mx-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))]">
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] uppercase tracking-[0.24em] font-semibold">
                    Email
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] uppercase tracking-[0.24em] font-semibold">
                    Source
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] uppercase tracking-[0.24em] font-semibold">
                    Variant
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] uppercase tracking-[0.24em] font-semibold">
                    Captured
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] uppercase tracking-[0.24em] font-semibold">
                    Converted
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] uppercase tracking-[0.24em] font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
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
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs tracking-wide break-all">
                        {lead.email}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] uppercase tracking-[0.2em] border-2 border-[hsl(var(--border-strong))] rounded ${
                          lead.source === 'plagiarism' 
                            ? 'bg-blue-500/10' 
                            : lead.source === 'import'
                            ? 'bg-purple-500/10'
                            : 'bg-green-500/10'
                        }`}>
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                        {lead.variant}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                        {capturedDate.toLocaleDateString()}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
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
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        {lead.convertedAt ? (
                          <span className="flex items-center gap-1 sm:gap-2 text-green-600">
                            <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                            <span className="text-[10px] uppercase tracking-[0.2em]">Converted</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 sm:gap-2 text-[hsl(var(--muted-foreground))]">
                            <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                            <span className="text-[10px] uppercase tracking-[0.2em]">Pending</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > leads.length && (
        <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] text-center">
          Showing {leads.length} of {total} leads
        </p>
      )}
    </div>
  );
}
