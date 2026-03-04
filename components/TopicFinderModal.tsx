'use client';

import { useState, useEffect } from 'react';
import { X, Search, Sparkles, AlertCircle, CheckCircle2, Lightbulb, Lock, ArrowRight, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import UpgradeModal from '@/components/UpgradeModal';
import { cn } from '@/lib/utils';
import { trackFunnel } from '@/lib/gtag';

interface ResearchGap {
  type: 'methodology' | 'geographic' | 'temporal' | 'demographic' | 'theoretical';
  description: string;
  severity: 'high' | 'medium' | 'low';
  aiAnalysis?: string; // Pro feature
}

interface TopicSuggestion {
  title: string;
  researchQuestion: string;
  uniquenessScore: number;
  whyUnique: string;
  gaps: ResearchGap[];
  aiInsights?: string; // Pro feature
}

interface TopicResult {
  topic: string;
  uniquenessScore: number;
  similarPapers: Array<{
    title: string;
    year?: number;
    authors: string;
    similarity: number;
  }>;
  suggestions: TopicSuggestion[];
  gaps: ResearchGap[];
  totalSimilarPapers: number;
  isLimited?: boolean;
  isPro?: boolean;
  usageCount?: number;
  limit?: number;
}

interface TopicFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topic: string, suggestion?: TopicSuggestion) => void;
  initialTopic?: string;
  projectType?: 'essay' | 'thesis' | 'research' | 'journal';
  methodology?: string;
  userPlan?: 'free' | 'standard' | 'pro' | 'team';
}

export default function TopicFinderModal({
  isOpen,
  onClose,
  onSelectTopic,
  initialTopic = '',
  projectType = 'thesis',
  methodology = '',
  userPlan = 'free',
}: TopicFinderModalProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [selectedProjectType, setSelectedProjectType] = useState<'essay' | 'thesis' | 'research' | 'journal'>(projectType);
  const [selectedMethodology, setSelectedMethodology] = useState<string>(methodology);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<TopicResult | null>(null);
  const [error, setError] = useState('');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<TopicSuggestion | null>(null);
  const t = useTranslations('components.topicFinderModal');

  const isPro = userPlan === 'pro' || userPlan === 'team' || userPlan === 'standard';

  useEffect(() => {
    if (isOpen && initialTopic) {
      setTopic(initialTopic);
    }
  }, [isOpen, initialTopic]);

  const handleAnalyze = async () => {
    const trimmedTopic = topic.trim();
    
    if (!trimmedTopic) {
      setError('Please enter a research topic');
      return;
    }
    
    if (trimmedTopic.length < 3) {
      setError('Topic must be at least 3 characters long');
      return;
    }
    
    if (trimmedTopic.length > 500) {
      setError('Topic is too long. Please keep it under 500 characters.');
      return;
    }

    setError('');
    setIsAnalyzing(true);
    setResult(null);
    setShowUpgradePrompt(false);

    try {
      const response = await fetch('/api/tools/topic-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          projectType: selectedProjectType,
          methodology: selectedMethodology || undefined,
        }),
      });

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = t('analysisFailed');
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          
          // Handle rate limit specifically
          if (response.status === 429) {
            // Track paywall view for topic finder limit
            trackFunnel.paywallView('feature_upgrade', 'topic_finder');
            
            const limitMessage = errorData.limit 
              ? `You've used ${errorData.usageCount || 0} of ${errorData.limit} free searches today.`
              : '';
            errorMessage = `${errorMessage} ${limitMessage}`.trim();
          }
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = t('serverError', { text: response.statusText || 'Unknown error' });
        }
        throw new Error(errorMessage);
      }

      // Parse successful response
      let data: TopicResult;
      try {
        data = await response.json();
      } catch {
        throw new Error(t('invalidResponse'));
      }

      // Validate response structure
      if (!data || typeof data !== 'object' || !data.topic) {
        throw new Error(t('invalidFormat'));
      }

      setResult(data);
      
      // Show upgrade prompt if free user and limited results
      if (!isPro && data.isLimited && data.suggestions.length === 1) {
        // Track paywall view for feature upgrade
        trackFunnel.paywallView('feature_upgrade', 'topic_finder');
        setShowUpgradePrompt(true);
      }
    } catch (err: any) {
      // Handle network errors
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError(t('networkError'));
      } else {
        setError(err.message || t('analysisFailed'));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectSuggestion = (suggestion: TopicSuggestion) => {
    setSelectedSuggestion(suggestion);
  };

  const handleConfirmSelection = () => {
    if (selectedSuggestion) {
      onSelectTopic(selectedSuggestion.title, selectedSuggestion);
      onClose();
    }
  };

  const handleUseCurrentTopic = () => {
    if (topic.trim()) {
      onSelectTopic(topic.trim());
      onClose();
    }
  };

  // Reset selected suggestion when result changes
  useEffect(() => {
    if (result) {
      setSelectedSuggestion(null);
    }
  }, [result]);

  const getUniquenessColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUniquenessLabel = (score: number) => {
    if (score >= 80) return t('highlyUnique');
    if (score >= 60) return t('moderatelyUnique');
    return t('needsRefinement');
  };

  const getUniquenessBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!isOpen) return null;

  return (
    <>
    <UpgradeModal
      isOpen={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
      reason="Unlock more topic suggestions and AI insights."
      suggestedPlan="standard"
    />
    <div className="fixed inset-0 bg-[hsl(var(--foreground))]/70 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[12px_12px_0_rgba(29,41,57,0.2)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-[3px] border-[hsl(var(--border-strong))]">
          <div className="flex items-center gap-3">
            <Lightbulb className="text-[hsl(var(--primary))]" size={24} />
            <div>
              <h2 className="text-xl font-bold uppercase tracking-[0.12em]">
                {t('title')}
              </h2>
              <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-1">
                {t('subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[hsl(var(--surface-muted))] rounded-(--radius) transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!result ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] block">
                  {t('researchTopicLabel')}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t('placeholder')}
                  className="w-full px-4 py-3 border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm uppercase tracking-[0.1em] focus:outline-none focus:border-[hsl(var(--primary))]"
                  onKeyDown={(e) => e.key === 'Enter' && !isAnalyzing && handleAnalyze()}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] block">
                    {t('projectTypeLabel')}
                  </label>
                  <select
                    value={selectedProjectType}
                    onChange={(e) => setSelectedProjectType(e.target.value as any)}
                    className="w-full px-3 py-2 border-[2px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-xs uppercase tracking-[0.1em] focus:outline-none focus:border-[hsl(var(--primary))]"
                  >
                    <option value="thesis">{t('projectTypeThesis')}</option>
                    <option value="essay">{t('projectTypeEssay')}</option>
                    <option value="research">{t('projectTypeResearch')}</option>
                    <option value="journal">{t('projectTypeJournal')}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] block">
                    {t('methodologyLabel')}
                  </label>
                  <select
                    value={selectedMethodology}
                    onChange={(e) => setSelectedMethodology(e.target.value)}
                    className="w-full px-3 py-2 border-[2px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-xs uppercase tracking-[0.1em] focus:outline-none focus:border-[hsl(var(--primary))]"
                  >
                    <option value="">{t('methodologyAny')}</option>
                    <option value="qualitative">{t('methodologyQualitative')}</option>
                    <option value="quantitative">{t('methodologyQuantitative')}</option>
                    <option value="mixed methods">{t('methodologyMixed')}</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="border-[2px] border-red-300 bg-red-50 rounded p-3 flex items-start gap-2">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-xs uppercase tracking-[0.14em] text-red-700">{error}</p>
                </div>
              )}

              <Button
                onClick={handleAnalyze}
                className="w-full py-3"
                disabled={isAnalyzing || !topic.trim()}
              >
                {isAnalyzing ? t('findingTopics') : t('findTopics')}
                {!isAnalyzing && <Search size={16} className="ml-2" />}
              </Button>

              {!isPro && (
                <div className="border-[2px] border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 rounded p-3 flex items-start gap-2">
                  <Lock className="text-[hsl(var(--accent))] flex-shrink-0 mt-0.5" size={16} />
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.14em] font-semibold mb-1">
                      {t('freeLimit')}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                      {t('upgradeHint')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Uniqueness Score */}
              <div className="text-center space-y-3 border-b-[2px] border-[hsl(var(--border-strong))] pb-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                  {t('uniquenessScoreLabel')}
                </p>
                <div className={cn('text-5xl font-bold', getUniquenessColor(result.uniquenessScore))}>
                  {result.uniquenessScore}%
                </div>
                <p className={cn('text-sm uppercase tracking-[0.2em] font-semibold', getUniquenessColor(result.uniquenessScore))}>
                  {getUniquenessLabel(result.uniquenessScore)}
                </p>
                <div className="w-full h-3 bg-[hsl(var(--surface-muted))] rounded-full overflow-hidden">
                  <div 
                    className={cn('h-full transition-all', getUniquenessBg(result.uniquenessScore))}
                    style={{ width: `${result.uniquenessScore}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 py-3 border-y-[2px] border-[hsl(var(--border-strong))]">
                <div className="text-center">
                  <p className="text-2xl font-bold">{result.totalSimilarPapers}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">{t('similarPapersFound')}</p>
                </div>
                <div className="text-center border-l-[2px] border-[hsl(var(--border-strong))]">
                  <p className="text-2xl font-bold">{result.suggestions.length}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">{t('uniqueTopicSuggestions')}</p>
                </div>
              </div>

              {/* Topic Suggestions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-[hsl(var(--primary))]" size={18} />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em]">
                    {t('uniqueTopicSuggestions')}
                  </h3>
                </div>
                <div className="space-y-3">
                  {result.suggestions.map((suggestion, index) => {
                    const isSelected = selectedSuggestion === suggestion;
                    return (
                    <div
                      key={index}
                      className={cn(
                        "border-[3px] rounded-(--radius) p-4 transition-colors cursor-pointer",
                        isSelected
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
                          : "border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] hover:border-[hsl(var(--primary))]"
                      )}
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-2 flex-1">
                          {isSelected && (
                            <CheckCircle2 className="text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" size={18} />
                          )}
                          <h4 className={cn(
                            "text-sm font-semibold uppercase tracking-[0.12em] flex-1",
                            isSelected && "text-[hsl(var(--primary))]"
                          )}>
                            {suggestion.title}
                          </h4>
                        </div>
                        <div className={cn(
                          'px-2 py-1 rounded text-xs font-bold uppercase tracking-[0.1em]',
                          suggestion.uniquenessScore >= 80 ? 'bg-green-500 text-white' :
                          suggestion.uniquenessScore >= 60 ? 'bg-yellow-500 text-white' :
                          'bg-red-500 text-white'
                        )}>
                          {suggestion.uniquenessScore}%
                        </div>
                      </div>
                      <p className="text-xs uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2">
                        {suggestion.researchQuestion}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle2 className="text-green-600 flex-shrink-0" size={14} />
                        <span className="text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                          {suggestion.whyUnique}
                        </span>
                      </div>
                      {suggestion.aiInsights && (
                        <div className="mt-3 pt-3 border-t-[2px] border-[hsl(var(--border-strong))]">
                          <div className="flex items-start gap-2">
                            <Zap className="text-[hsl(var(--accent))] flex-shrink-0 mt-0.5" size={14} />
                            <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                              {suggestion.aiInsights}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                  })}
                </div>
              </div>

              {/* Research Gaps */}
              {result.gaps.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] flex items-center gap-2">
                    <AlertCircle className="text-[hsl(var(--primary))]" size={18} />
                    {t('researchGapsFound')}
                  </h3>
                  <div className="space-y-2">
                    {result.gaps.map((gap, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex items-start gap-2 border-[2px] rounded p-3',
                          gap.severity === 'high'
                            ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
                            : 'border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))]'
                        )}
                      >
                        <AlertCircle className={cn(
                          'flex-shrink-0 mt-0.5',
                          gap.severity === 'high' ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'
                        )} size={16} />
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-[0.12em] font-semibold mb-1">
                            {t('gapType', { type: gap.type.charAt(0).toUpperCase() + gap.type.slice(1) })}
                          </p>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))]">
                            {gap.description}
                          </p>
                          {gap.aiAnalysis && (
                            <p className="text-[10px] uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mt-2 italic">
                              AI Analysis: {gap.aiAnalysis}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pro Upgrade Prompt */}
              {showUpgradePrompt && !isPro && (
                <div className="border-[3px] border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 rounded-(--radius) p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Lock className="text-[hsl(var(--accent))] flex-shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.14em] mb-2">
                        {t('upgradeTitle')}
                      </h4>
                      <p className="text-xs uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))] mb-3">
                        {t('upgradeBody')}
                      </p>
                      <Button className="w-full py-2 text-xs" onClick={() => setShowUpgradeModal(true)}>
                        {t('upgradeCta')}
                        <ArrowRight size={14} className="ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Usage Limit Info */}
              {!isPro && result.usageCount !== undefined && result.limit !== undefined && (
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                    {t('usageLimit', { used: result.usageCount, limit: result.limit })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t-[3px] border-[hsl(var(--border-strong))]">
          {result ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setError('');
                }}
              >
                {t('newSearch')}
              </Button>
              <div className="flex gap-3">
                {topic.trim() && (
                  <Button
                    variant="outline"
                    onClick={handleUseCurrentTopic}
                  >
                    Use &quot;{topic.trim().substring(0, 30)}{topic.length > 30 ? '...' : ''}&quot;
                  </Button>
                )}
                {selectedSuggestion && (
                  <Button onClick={handleConfirmSelection}>
                    {t('useSelectedTopic')}
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                )}
              </div>
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
