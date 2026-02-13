'use client';

import { useState, useCallback, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import {
  X,
  BookOpen,
  Sparkles,
  Search,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import type {
  Citation,
  PlanType,
  LitReviewAnalysis,
  LitReviewTheme,
  LitReviewGap,
  LitReviewSynthesis,
} from '@/types';
import { getCitationStats, detectStaleness } from '@/lib/lit-review';

type Tab = 'overview' | 'themes' | 'gaps';

interface LitReviewAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  citations: Citation[];
  topic: string;
  methodology: string;
  citationStyle: string;
  currentSectionContent: string;
  onInsertContent: (html: string) => void;
  onOpenCitationDiscovery: (searchQuery?: string) => void;
  userPlan: PlanType;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export default function LitReviewAssistant({
  isOpen,
  onClose,
  projectId,
  citations,
  topic,
  methodology,
  citationStyle,
  onInsertContent,
  onOpenCitationDiscovery,
  userPlan,
  t,
}: LitReviewAssistantProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [analysis, setAnalysis] = useState<LitReviewAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null);

  // Synthesis state
  const [synthTarget, setSynthTarget] = useState<{
    id: string;
    type: 'theme' | 'gap';
  } | null>(null);
  const [synthLoading, setSynthLoading] = useState(false);
  const [synthResult, setSynthResult] = useState<LitReviewSynthesis | null>(null);
  const [synthError, setSynthError] = useState<string | null>(null);

  // Upgrade state
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Success toast
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeCitations = citations.filter((c) => !excludedIds.has(c.id));
  const stats = getCitationStats(activeCitations);
  const staleness = detectStaleness(
    analysis,
    activeCitations.map((c) => c.id)
  );

  // Clear success toast
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleAnalyze = useCallback(async () => {
    if (activeCitations.length < 3) return;

    setIsAnalyzing(true);
    setAnalyzeError(null);
    setShowUpgrade(false);

    try {
      const res = await fetch('/api/ai/lit-review/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          citations: activeCitations.map((c) => ({
            id: c.id,
            title: c.title,
            authors: c.authors,
            year: c.year,
            journal: c.journal,
            abstract: (c as Citation & { abstract?: string }).abstract,
          })),
          topic,
          methodology,
          citationStyle,
        }),
      });

      if (res.status === 429) {
        const data = await res.json();
        if (data.upgradeRequired) {
          setShowUpgrade(true);
        } else {
          setAnalyzeError(data.error || t('litReview.limitReached'));
        }
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setAnalyzeError(data.error || t('litReview.errorGeneric'));
        return;
      }

      const data = await res.json();
      setAnalysis(data.analysis);

      // Auto-switch to themes if we got results
      if (data.analysis.themes.length > 0) {
        setActiveTab('themes');
      }
    } catch {
      setAnalyzeError(t('litReview.errorGeneric'));
    } finally {
      setIsAnalyzing(false);
    }
  }, [activeCitations, projectId, topic, methodology, citationStyle, t]);

  const handleSynthesize = useCallback(
    async (targetId: string, type: 'theme' | 'gap') => {
      setSynthTarget({ id: targetId, type });
      setSynthLoading(true);
      setSynthResult(null);
      setSynthError(null);

      const allCitationTexts = citations.map((c) => ({
        citationId: c.id,
        citationText: c.citationText,
      }));

      let body: Record<string, unknown> = {
        type,
        topic,
        methodology,
        citationStyle,
        allCitationTexts,
      };

      if (type === 'theme' && analysis) {
        const theme = analysis.themes.find((t) => t.id === targetId);
        if (!theme) return;

        const enrichedPapers = theme.papers.map((p) => {
          const cit = citations.find((c) => c.id === p.citationId);
          return {
            ...p,
            title: cit?.title || 'Untitled',
            citationText: cit?.citationText || '',
          };
        });

        body = {
          ...body,
          theme: {
            id: theme.id,
            name: theme.name,
            description: theme.description,
            papers: enrichedPapers,
          },
        };
      } else if (type === 'gap' && analysis) {
        const gap = analysis.gaps.find((g) => g.id === targetId);
        if (!gap) return;
        body = { ...body, gap };
      }

      try {
        const res = await fetch('/api/ai/lit-review/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json();
          setSynthError(data.error || t('litReview.errorGeneric'));
          return;
        }

        const data = await res.json();
        setSynthResult(data.synthesis);
      } catch {
        setSynthError(t('litReview.errorGeneric'));
      } finally {
        setSynthLoading(false);
      }
    },
    [analysis, citations, topic, methodology, citationStyle, t]
  );

  const handleInsert = useCallback(() => {
    if (!synthResult) return;

    const html = `<p>${synthResult.paragraph}</p>`;
    onInsertContent(html);

    setSuccessMsg(
      t('litReview.synthSuccess', {
        count: synthResult.citationsUsed.length,
      })
    );

    setSynthTarget(null);
    setSynthResult(null);
  }, [synthResult, onInsertContent, t]);

  const handleRetry = useCallback(() => {
    if (!synthTarget) return;
    handleSynthesize(synthTarget.id, synthTarget.type);
  }, [synthTarget, handleSynthesize]);

  if (!isOpen) return null;

  const canAnalyze = activeCitations.length >= 3;

  const stanceColor = (stance: string) => {
    switch (stance) {
      case 'supports':
        return 'text-green-700';
      case 'contradicts':
        return 'text-red-700';
      case 'discusses':
        return 'text-yellow-700';
      default:
        return 'text-[hsl(var(--muted-foreground))]';
    }
  };

  const stanceLabel = (stance: string) => {
    switch (stance) {
      case 'supports':
        return t('litReview.supporting');
      case 'contradicts':
        return t('litReview.contradicting');
      case 'discusses':
        return t('litReview.discusses');
      default:
        return stance;
    }
  };

  const groupByStance = (papers: LitReviewTheme['papers']) => {
    const groups: Record<string, LitReviewTheme['papers']> = {
      supports: [],
      contradicts: [],
      discusses: [],
    };
    for (const p of papers) {
      if (groups[p.stance]) groups[p.stance].push(p);
    }
    return groups;
  };

  const citationLabel = (citationId: string) => {
    const c = citations.find((ci) => ci.id === citationId);
    if (!c) return citationId;
    const firstAuthor = c.authors?.[0]?.split(' ').pop() || c.authors?.[0] || 'Unknown';
    const etAl = c.authors.length > 2 ? ' et al.' : c.authors.length === 2 ? ` & ${c.authors[1].split(' ').pop()}` : '';
    return `${firstAuthor}${etAl} (${c.year || 'n.d.'})`;
  };

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-[hsl(var(--foreground))]/40 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="complementary"
        aria-label={t('litReview.panelTitle')}
        className="fixed top-0 right-0 w-full sm:w-[400px] h-full bg-[hsl(var(--surface))] border-l-[4px] border-[hsl(var(--border-strong))] z-40 flex flex-col shadow-[-6px_0_0_rgba(29,41,57,0.12)]"
      >
        {/* Header */}
        <div className="border-b-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] p-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2 border-[hsl(var(--secondary-foreground))] rounded-(--radius) flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.24em]">
                  {t('litReview.panelTitle')}
                </h2>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--secondary-foreground))]">
                  {t('litReview.summaryPapers', { count: stats.count })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 border-2 border-[hsl(var(--secondary-foreground))] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Staleness banner */}
        {staleness.isStale && (
          <div className="px-4 py-2 bg-yellow-50 border-b-[2px] border-[hsl(var(--border-strong))] text-xs flex items-center justify-between gap-2">
            <span className="text-yellow-800">
              {t('litReview.staleWarning', {
                count: staleness.added + staleness.removed,
              })}
            </span>
            <button
              onClick={handleAnalyze}
              className="text-yellow-800 font-semibold underline whitespace-nowrap uppercase tracking-[0.12em] text-[10px]"
            >
              {t('litReview.staleUpdate')}
            </button>
          </div>
        )}

        {/* Success toast */}
        {successMsg && (
          <div className="px-4 py-2 bg-green-50 border-b-[2px] border-[hsl(var(--border-strong))] text-xs text-green-800 font-medium">
            {successMsg}
          </div>
        )}

        {/* Tab bar */}
        <div
          role="tablist"
          aria-label="Analysis views"
          className="flex border-b-[3px] border-[hsl(var(--border-strong))] shrink-0 bg-[hsl(var(--surface-muted))]"
        >
          {(['overview', 'themes', 'gaps'] as Tab[]).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`panel-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.24em] transition-colors ${
                activeTab === tab
                  ? 'text-[hsl(var(--secondary))] border-b-[3px] border-[hsl(var(--secondary))] -mb-[3px] bg-[hsl(var(--surface))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              {t(`litReview.tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)}
              {tab === 'themes' && analysis && (
                <span className="ml-1 opacity-70">
                  ({analysis.themes.length})
                </span>
              )}
              {tab === 'gaps' && analysis && (
                <span className="ml-1 opacity-70">
                  ({analysis.gaps.length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {/* ===== OVERVIEW TAB ===== */}
          {activeTab === 'overview' && (
            <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" className="p-4 space-y-4">
              {/* Welcome / summary */}
              {!analysis && !isAnalyzing && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    {t('litReview.welcomeHeading')}
                  </h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                    {t('litReview.welcomeBody')}
                  </p>
                  <ul className="text-xs text-[hsl(var(--muted-foreground))] space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--secondary))] mt-1.5 shrink-0" />
                      {t('litReview.welcomeBullet1')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--secondary))] mt-1.5 shrink-0" />
                      {t('litReview.welcomeBullet2')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--secondary))] mt-1.5 shrink-0" />
                      {t('litReview.welcomeBullet3')}
                    </li>
                  </ul>
                </div>
              )}

              {/* Analysis summary */}
              {analysis && (
                <div className="border-[2px] border-[hsl(var(--border-strong))] rounded-(--radius) p-3 bg-[hsl(var(--secondary)/0.06)]">
                  <p className="text-xs leading-relaxed text-[hsl(var(--foreground))]">{analysis.summary}</p>
                </div>
              )}

              {/* Stats card */}
              <div className="border-[2px] border-[hsl(var(--border-strong))] rounded-(--radius) p-3 space-y-1.5">
                <div className="text-xs font-semibold text-[hsl(var(--foreground))] uppercase tracking-[0.12em]">
                  {t('litReview.summaryPapers', { count: stats.count })} · {stats.yearRange}
                </div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  {t('litReview.summaryJournals', { count: stats.journalCount })}
                </div>
                {stats.primaryAuthors.length > 0 && (
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    {t('litReview.summaryAuthors', {
                      authors: stats.primaryAuthors.join(', '),
                    })}
                  </div>
                )}
                {stats.missingAbstracts > 0 && (
                  <div className="text-xs text-yellow-700 flex items-center gap-1.5 mt-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {t('litReview.summaryNoAbstracts', {
                      count: stats.missingAbstracts,
                    })}
                  </div>
                )}
              </div>

              {/* Analyze CTA */}
              {!canAnalyze ? (
                <div className="text-center space-y-2 py-2">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {t('litReview.minCitations')}
                  </p>
                  <button
                    onClick={() => onOpenCitationDiscovery()}
                    className="text-xs font-semibold text-[hsl(var(--secondary))] underline uppercase tracking-[0.12em]"
                  >
                    {t('litReview.discoverCitations')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className={`w-full py-3 rounded-(--radius) text-xs font-semibold uppercase tracking-[0.24em] transition-all flex items-center justify-center gap-2 border-2 ${
                    analysis
                      ? 'border-[hsl(var(--border-strong))] text-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary)/0.06)]'
                      : 'border-[hsl(var(--border-strong))] bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]'
                  } disabled:opacity-50 disabled:pointer-events-none`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('litReview.analyzing')}
                    </>
                  ) : analysis ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      {t('litReview.reanalyzeCta')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {t('litReview.analyzeCta', { count: activeCitations.length })}
                    </>
                  )}
                </button>
              )}

              {/* Error */}
              {analyzeError && (
                <p className="text-xs text-red-700 font-medium">{analyzeError}</p>
              )}

              {/* Upgrade prompt */}
              {showUpgrade && (
                <div className="border-[2px] border-[hsl(var(--border-strong))] rounded-(--radius) p-4 space-y-2 bg-[hsl(var(--accent)/0.1)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--foreground))]">
                    {t('litReview.upgradeTitle')}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {t('litReview.upgradeBody')}
                  </p>
                  <Link
                    href="/settings"
                    className="inline-block mt-1 px-4 py-2 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-[10px] font-semibold uppercase tracking-[0.24em] border-2 border-[hsl(var(--border-strong))] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
                  >
                    {t('litReview.upgradeCta')}
                  </Link>
                </div>
              )}

              {/* Citation list */}
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] mb-2">
                  {t('litReview.yourCitations')}
                </h4>
                <div className="space-y-1.5">
                  {citations.map((c) => {
                    const isExpanded = expandedCitation === c.id;
                    const isExcluded = excludedIds.has(c.id);
                    const citTheme = analysis?.themes.find((th) =>
                      th.papers.some((p) => p.citationId === c.id)
                    );
                    const citStance = citTheme?.papers.find(
                      (p) => p.citationId === c.id
                    )?.stance;

                    return (
                      <div
                        key={c.id}
                        className={`border-[2px] border-[hsl(var(--border-strong))] rounded-(--radius) text-xs transition-opacity ${
                          isExcluded ? 'opacity-40' : ''
                        }`}
                      >
                        <button
                          onClick={() =>
                            setExpandedCitation(isExpanded ? null : c.id)
                          }
                          className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-[hsl(var(--surface-muted))] transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 shrink-0" />
                          )}
                          {citStance && (
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                citStance === 'supports'
                                  ? 'bg-green-600'
                                  : citStance === 'contradicts'
                                  ? 'bg-red-600'
                                  : 'bg-yellow-600'
                              }`}
                              aria-hidden="true"
                            />
                          )}
                          <span className="truncate font-semibold text-[hsl(var(--foreground))]">
                            {citationLabel(c.id)}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-3 pb-3 space-y-1.5 text-[hsl(var(--muted-foreground))] border-t border-[hsl(var(--border-strong))]">
                            <p className="font-semibold text-[hsl(var(--foreground))] pt-2">
                              {c.title}
                            </p>
                            {c.journal && <p>{c.journal}</p>}
                            {(c as Citation & { abstract?: string }).abstract &&
                              (c as Citation & { abstract?: string }).abstract !==
                                'No abstract available.' && (
                                <p className="italic line-clamp-3">
                                  {
                                    (c as Citation & { abstract?: string })
                                      .abstract
                                  }
                                </p>
                              )}
                            {citTheme && citStance && (
                              <p>
                                Theme: {citTheme.name} (
                                <span className={stanceColor(citStance)}>
                                  {stanceLabel(citStance)}
                                </span>
                                )
                              </p>
                            )}
                            <label className="flex items-center gap-2 cursor-pointer pt-1">
                              <input
                                type="checkbox"
                                checked={isExcluded}
                                onChange={() => {
                                  setExcludedIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(c.id)) {
                                      next.delete(c.id);
                                    } else {
                                      next.add(c.id);
                                    }
                                    return next;
                                  });
                                }}
                                className="rounded-(--radius)"
                              />
                              {t('litReview.excludeFromAnalysis')}
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===== THEMES TAB ===== */}
          {activeTab === 'themes' && (
            <div
              id="panel-themes"
              role="tabpanel"
              aria-labelledby="tab-themes"
              className="p-4 space-y-3"
            >
              {!analysis ? (
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-8">
                  {t('litReview.themesEmpty')}
                </p>
              ) : analysis.themes.length === 0 ? (
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-8">
                  {t('litReview.themesNone')}
                </p>
              ) : (
                <>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                    {t('litReview.themesFound', {
                      count: analysis.themes.length,
                    })}
                  </h3>

                  {/* Consensus note */}
                  {analysis.themes.every((th) =>
                    th.papers.every((p) => p.stance === 'supports')
                  ) && (
                    <div className="text-xs text-yellow-800 bg-yellow-50 border-2 border-yellow-300 px-3 py-2 rounded-(--radius)">
                      {t('litReview.consensusNote')}
                    </div>
                  )}

                  {analysis.themes.map((theme) => {
                    const groups = groupByStance(theme.papers);
                    const isSynthTarget =
                      synthTarget?.id === theme.id &&
                      synthTarget?.type === 'theme';

                    return (
                      <div
                        key={theme.id}
                        className="border-l-[4px] border-l-[hsl(var(--secondary))] border-[2px] border-[hsl(var(--border-strong))] rounded-(--radius) p-3 space-y-2"
                        role="region"
                        aria-label={`Theme: ${theme.name}`}
                      >
                        <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                          {theme.name}
                        </h4>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {theme.description}
                        </p>

                        {/* Supporting */}
                        {groups.supports.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="w-2 h-2 rounded-full bg-green-600" aria-hidden="true" />
                              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-green-700">
                                {t('litReview.supporting')} ({groups.supports.length})
                              </span>
                            </div>
                            <ul className="text-xs text-[hsl(var(--muted-foreground))] space-y-0.5 ml-3.5">
                              {groups.supports.map((p) => (
                                <li key={p.citationId}>{citationLabel(p.citationId)}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Contradicting */}
                        {groups.contradicts.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="w-2 h-2 rounded-full bg-red-600" aria-hidden="true" />
                              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700">
                                {t('litReview.contradicting')} ({groups.contradicts.length})
                              </span>
                            </div>
                            <ul className="text-xs space-y-1 ml-3.5">
                              {groups.contradicts.map((p) => (
                                <li key={p.citationId}>
                                  <span className="text-[hsl(var(--muted-foreground))]">
                                    {citationLabel(p.citationId)}
                                  </span>
                                  {p.reasoning && (
                                    <span className="text-red-600/70 block ml-2">
                                      — {p.reasoning}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Discusses */}
                        {groups.discusses.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="w-2 h-2 rounded-full bg-yellow-600" aria-hidden="true" />
                              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-yellow-700">
                                {t('litReview.discusses')} ({groups.discusses.length})
                              </span>
                            </div>
                            <ul className="text-xs text-[hsl(var(--muted-foreground))] space-y-0.5 ml-3.5">
                              {groups.discusses.map((p) => (
                                <li key={p.citationId}>{citationLabel(p.citationId)}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Synthesis button / preview */}
                        {isSynthTarget && synthLoading ? (
                          <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] py-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            {t('litReview.synthesizing')}
                          </div>
                        ) : isSynthTarget && synthResult ? (
                          <SynthesisPreview
                            synthesis={synthResult}
                            onInsert={handleInsert}
                            onRetry={handleRetry}
                            t={t}
                          />
                        ) : isSynthTarget && synthError ? (
                          <div className="text-xs text-red-700 py-2">
                            {synthError}
                            <button onClick={handleRetry} className="ml-2 underline font-semibold">
                              {t('litReview.synthRetry')}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSynthesize(theme.id, 'theme')}
                            className="flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--secondary))] hover:underline transition-colors pt-1 uppercase tracking-[0.12em]"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {t('litReview.draftParagraph')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* ===== GAPS TAB ===== */}
          {activeTab === 'gaps' && (
            <div
              id="panel-gaps"
              role="tabpanel"
              aria-labelledby="tab-gaps"
              className="p-4 space-y-3"
            >
              {!analysis ? (
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-8">
                  {t('litReview.gapsEmpty')}
                </p>
              ) : analysis.gaps.length === 0 ? (
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-8">
                  {t('litReview.gapsNone')}
                </p>
              ) : (
                <>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                    {t('litReview.gapsFound', {
                      count: analysis.gaps.length,
                    })}
                  </h3>

                  {analysis.gaps.map((gap) => {
                    const isSynthTarget =
                      synthTarget?.id === gap.id &&
                      synthTarget?.type === 'gap';

                    return (
                      <div
                        key={gap.id}
                        className="border-[2px] border-[hsl(var(--border-strong))] rounded-(--radius) p-3 space-y-2"
                        role="region"
                        aria-label={`Gap: ${gap.title}`}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                          <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">{gap.title}</h4>
                        </div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {gap.description}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] italic">
                          {gap.suggestion}
                        </p>

                        {/* Actions */}
                        {isSynthTarget && synthLoading ? (
                          <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] py-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            {t('litReview.synthesizing')}
                          </div>
                        ) : isSynthTarget && synthResult ? (
                          <SynthesisPreview
                            synthesis={synthResult}
                            onInsert={handleInsert}
                            onRetry={handleRetry}
                            t={t}
                          />
                        ) : isSynthTarget && synthError ? (
                          <div className="text-xs text-red-700 py-1">
                            {synthError}
                            <button onClick={handleRetry} className="ml-2 underline font-semibold">
                              {t('litReview.synthRetry')}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 pt-1">
                            <button
                              onClick={() => handleSynthesize(gap.id, 'gap')}
                              className="flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--secondary))] hover:underline uppercase tracking-[0.12em]"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              {t('litReview.useInWriting')}
                            </button>
                            {gap.searchQuery && (
                              <button
                                onClick={() => onOpenCitationDiscovery(gap.searchQuery)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] uppercase tracking-[0.12em]"
                              >
                                <Search className="w-3.5 h-3.5" />
                                {t('litReview.findPapers')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

// Synthesis preview sub-component
function SynthesisPreview({
  synthesis,
  onInsert,
  onRetry,
  t,
}: {
  synthesis: LitReviewSynthesis;
  onInsert: () => void;
  onRetry: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="border-[2px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface-muted))] p-3 space-y-2">
      <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-[0.24em]">
        {t('litReview.synthPreview')}
      </p>
      <p className="text-xs leading-relaxed text-[hsl(var(--foreground))]">{synthesis.paragraph}</p>
      <div className="flex items-center gap-3 text-[10px] text-[hsl(var(--muted-foreground))]">
        <span>{t('litReview.synthWords', { count: synthesis.wordCount })}</span>
        <span>·</span>
        <span>
          {t('litReview.synthCitations', {
            count: synthesis.citationsUsed.length,
          })}
        </span>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onInsert}
          className="px-4 py-2 bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] text-[10px] font-semibold uppercase tracking-[0.24em] border-2 border-[hsl(var(--border-strong))] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
        >
          {t('litReview.synthInsert')}
        </button>
        <button
          onClick={onRetry}
          className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] border-2 border-[hsl(var(--border-strong))] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150 text-[hsl(var(--foreground))]"
        >
          {t('litReview.synthRetry')}
        </button>
      </div>
    </div>
  );
}
