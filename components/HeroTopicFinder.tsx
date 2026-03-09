'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search, ArrowRight, Sparkles, AlertCircle, CheckCircle2, Lightbulb, Plus, X, BookOpen } from 'lucide-react';
import Button from '@/components/ui/Button';
import LeadMagnetEmailCapture from './LeadMagnetEmailCapture';
import { trackLeadMagnet } from '@/lib/gtag';
import { cn } from '@/lib/utils';

interface HeroTopicFinderProps {
  variant: 'control' | 'variant_a' | 'variant_b';
}

interface ResearchGap {
  type: 'methodology' | 'geographic' | 'temporal' | 'demographic' | 'theoretical';
  description: string;
  severity: 'high' | 'medium' | 'low';
}

interface TopicSuggestion {
  title: string;
  researchQuestion: string;
  uniquenessScore: number;
  whyUnique: string;
  gaps: ResearchGap[];
}

interface TopicResult {
  topic: string;
  uniquenessScore: number;
  similarPapers: Array<{
    title: string;
    year?: number;
    authors: string;
    journal?: string;
    url?: string;
    similarity: number;
  }>;
  suggestions: TopicSuggestion[];
  gaps: ResearchGap[];
  totalSimilarPapers: number;
}

export default function HeroTopicFinder({ variant }: HeroTopicFinderProps) {
  const t = useTranslations('components');
  const [topic, setTopic] = useState('');
  const [projectType, setProjectType] = useState<'essay' | 'thesis' | 'research' | 'journal'>('thesis');
  const [methodology, setMethodology] = useState<'qualitative' | 'quantitative' | 'mixed methods' | ''>('');
  const [areasOfInterest, setAreasOfInterest] = useState<string[]>([]);
  const [areaInput, setAreaInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [result, setResult] = useState<TopicResult | null>(null);
  const [error, setError] = useState('');

  const addArea = () => {
    const trimmed = areaInput.trim();
    if (trimmed && !areasOfInterest.includes(trimmed) && areasOfInterest.length < 5) {
      setAreasOfInterest(prev => [...prev, trimmed]);
      setAreaInput('');
    }
  };

  const removeArea = (area: string) => {
    setAreasOfInterest(prev => prev.filter(a => a !== area));
  };

  useEffect(() => {
    trackLeadMagnet.view('topic', variant);
  }, [variant]);

  const handleAnalyze = async () => {
    if (!topic.trim()) {
      setError(t('topicFinder.errorEnterTopic'));
      return;
    }

    setError('');
    setIsAnalyzing(true);
    setResult(null);
    trackLeadMagnet.scanStarted('topic');

    try {
      const response = await fetch('/api/tools/topic-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          projectType,
          methodology: methodology || undefined,
          areasOfInterest: areasOfInterest.length > 0 ? areasOfInterest : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setResult(data);
      trackLeadMagnet.resultViewed('topic', data.uniquenessScore);

      // Store results for continuation after signup
      sessionStorage.setItem('lead_magnet_content', JSON.stringify({
        type: 'topic',
        result: data,
        topic: topic.trim(),
        projectType,
        methodology,
        areasOfInterest,
        timestamp: Date.now(),
        expires: Date.now() + 3600 * 1000,
      }));
    } catch (err: any) {
      setError(err.message || t('topicFinder.analysisFailed'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetFullResultsClick = () => {
    trackLeadMagnet.signupClicked('topic');
    setShowEmailCapture(true);
  };

  const handleEmailSubmit = async (email: string) => {
    // Store result in sessionStorage for continuation after signup
    if (result) {
      try {
        sessionStorage.setItem('lead_magnet_content', JSON.stringify({
          type: 'topic',
          result: {
            topic: topic.trim(),
            uniquenessScore: result.uniquenessScore,
            suggestions: result.suggestions,
            gaps: result.gaps,
            totalSimilarPapers: result.totalSimilarPapers,
          },
          timestamp: Date.now(),
        }));
      } catch (err) {
        console.error('Failed to store topic finder result:', err);
      }
    }

    // Capture lead
    await fetch('/api/leads/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        source: 'topic',
        variant,
        metadata: {
          topic: topic.trim(),
          projectType,
          methodology,
          uniquenessScore: result?.uniquenessScore,
        },
      }),
    });

    trackLeadMagnet.emailCaptured('topic');
    
    // Redirect to signup
    window.location.href = `/auth/signup?from=topic&email=${encodeURIComponent(email)}`;
  };

  const getUniquenessColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUniquenessLabel = (score: number) => {
    if (score >= 80) return t('topicFinder.highlyUnique');
    if (score >= 60) return t('topicFinder.moderatelyUnique');
    return t('topicFinder.needsRefinement');
  };

  const getUniquenessBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb size={16} className="text-[hsl(var(--primary))]" />
        <span className="text-[10px] uppercase tracking-[0.28em] font-semibold text-[hsl(var(--muted-foreground))]">
          {t('topicFinder.label')}
        </span>
      </div>

      {!result ? (
        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4">
          <div className="space-y-3">
            {/* Topic input */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] block">
                {t('topicFinder.researchTopicLabel')}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t('topicFinder.placeholder')}
                className="w-full px-4 py-3 border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm focus:outline-none focus:border-[hsl(var(--primary))]"
                onKeyDown={(e) => e.key === 'Enter' && !isAnalyzing && handleAnalyze()}
              />
            </div>

            {/* Areas of interest */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] block">
                Areas of Interest <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  placeholder="e.g. brand management, social media..."
                  className="flex-1 px-3 py-2 border-[2px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm focus:outline-none focus:border-[hsl(var(--primary))]"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addArea(); } }}
                  disabled={areasOfInterest.length >= 5}
                />
                <button
                  type="button"
                  onClick={addArea}
                  disabled={!areaInput.trim() || areasOfInterest.length >= 5}
                  className="px-3 py-2 border-[2px] border-[hsl(var(--border-strong))] rounded-(--radius) hover:bg-[hsl(var(--surface-muted))] disabled:opacity-40 transition-colors"
                >
                  <Plus size={15} />
                </button>
              </div>
              {areasOfInterest.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {areasOfInterest.map(area => (
                    <span
                      key={area}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[hsl(var(--primary))]/10 border-[2px] border-[hsl(var(--primary))] rounded-full text-xs font-medium"
                    >
                      {area}
                      <button type="button" onClick={() => removeArea(area)} className="hover:text-red-500 transition-colors">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Project type + Methodology — stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] block">
                  {t('topicFinder.projectTypeLabel')}
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as any)}
                  className="w-full px-3 py-2 border-[2px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm focus:outline-none focus:border-[hsl(var(--primary))]"
                >
                  <option value="thesis">{t('topicFinder.projectTypeThesis')}</option>
                  <option value="essay">{t('topicFinder.projectTypeEssay')}</option>
                  <option value="research">{t('topicFinder.projectTypeResearch')}</option>
                  <option value="journal">{t('topicFinder.projectTypeJournal')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] block">
                  {t('topicFinder.methodologyLabel')}
                </label>
                <select
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value as any)}
                  className="w-full px-3 py-2 border-[2px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm focus:outline-none focus:border-[hsl(var(--primary))]"
                >
                  <option value="">{t('topicFinder.methodologyAny')}</option>
                  <option value="qualitative">{t('topicFinder.methodologyQualitative')}</option>
                  <option value="quantitative">{t('topicFinder.methodologyQuantitative')}</option>
                  <option value="mixed methods">{t('topicFinder.methodologyMixed')}</option>
                </select>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              onClick={handleAnalyze}
              className="w-full py-3"
              disabled={isAnalyzing || !topic.trim()}
            >
              {isAnalyzing ? t('topicFinder.findingTopics') : t('topicFinder.findTopics')}
              {!isAnalyzing && <Search size={16} className="ml-2" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 space-y-4">
          {/* Uniqueness Score */}
          <div className="text-center space-y-2">
            <p className="text-[9px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              {t('topicFinder.uniquenessScoreLabel')}
            </p>
            <div className={cn('text-4xl font-bold', getUniquenessColor(result.uniquenessScore))}>
              {result.uniquenessScore}%
            </div>
            <p className={cn('text-xs uppercase tracking-[0.2em] font-semibold', getUniquenessColor(result.uniquenessScore))}>
              {getUniquenessLabel(result.uniquenessScore)}
            </p>
            <div className="w-full h-2 bg-[hsl(var(--surface-muted))] rounded-full overflow-hidden">
              <div
                className={cn('h-full transition-all', getUniquenessBg(result.uniquenessScore))}
                style={{ width: `${result.uniquenessScore}%` }}
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-2 py-2 border-y-[2px] border-[hsl(var(--border-strong))]">
            <div className="text-center">
              <p className="text-lg font-bold">{result.totalSimilarPapers}</p>
              <p className="text-[9px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">{t('topicFinder.similarPapers')}</p>
            </div>
            <div className="text-center border-l-[2px] border-[hsl(var(--border-strong))]">
              <p className="text-lg font-bold">{result.suggestions.length}</p>
              <p className="text-[9px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">{t('topicFinder.uniqueAngles')}</p>
            </div>
          </div>

          {/* Top Suggestion Preview */}
          {result.suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="text-[hsl(var(--primary))]" size={14} />
                <p className="text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] font-semibold">
                  {t('topicFinder.topSuggestion')}
                </p>
              </div>
              <div className="border-[2px] border-[hsl(var(--primary))] rounded p-3 bg-[hsl(var(--primary))]/5">
                <p className="text-sm font-semibold mb-1.5">
                  {result.suggestions[0].title}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] italic mb-2">
                  {result.suggestions[0].researchQuestion}
                </p>
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={12} />
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {result.suggestions[0].whyUnique}
                  </span>
                </div>
              </div>
              {result.suggestions.length > 1 && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
                  + {result.suggestions.length - 1} more topic suggestion{result.suggestions.length > 2 ? 's' : ''} available after sign-up
                </p>
              )}
            </div>
          )}

          {/* Teaser: 1 paper preview */}
          {result.similarPapers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="text-[hsl(var(--primary))]" size={14} />
                <p className="text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] font-semibold">
                  Related journal article
                </p>
              </div>
              <div className="border-[2px] border-[hsl(var(--border-strong))] rounded p-3 bg-[hsl(var(--surface-muted))]">
                <p className="text-xs font-medium leading-snug mb-1">
                  {result.similarPapers[0].title}
                </p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  {result.similarPapers[0].authors}
                  {result.similarPapers[0].year && ` · ${result.similarPapers[0].year}`}
                </p>
                {result.similarPapers[0].journal && (
                  <p className="text-[10px] text-[hsl(var(--primary))]/80 italic mt-0.5">
                    {result.similarPapers[0].journal}
                  </p>
                )}
              </div>
              {result.similarPapers.length > 1 && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
                  + {result.similarPapers.length - 1} more papers with full references after sign-up
                </p>
              )}
            </div>
          )}

          {/* Research Gaps Preview */}
          {result.gaps.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] font-semibold flex items-center gap-1.5">
                <AlertCircle size={12} />
                {t('topicFinder.researchGapsFound')}
              </p>
              {result.gaps.slice(0, 1).map((gap, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-2 border-[2px] rounded p-2',
                    gap.severity === 'high'
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
                      : 'border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))]'
                  )}
                >
                  <AlertCircle className={cn(
                    'flex-shrink-0 mt-0.5',
                    gap.severity === 'high' ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'
                  )} size={13} />
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {gap.description}
                  </span>
                </div>
              ))}
              {result.gaps.length > 1 && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
                  + {result.gaps.length - 1} more gap{result.gaps.length > 2 ? 's' : ''} identified — sign up to see all
                </p>
              )}
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={handleGetFullResultsClick}
            className="w-full py-3"
          >
            Get all {result.suggestions.length} topics + {result.similarPapers.length} papers
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      )}

      <LeadMagnetEmailCapture
        isOpen={showEmailCapture}
        onClose={() => setShowEmailCapture(false)}
        onSubmit={handleEmailSubmit}
        source="topic"
        isLoading={isAnalyzing}
      />
    </div>
  );
}
