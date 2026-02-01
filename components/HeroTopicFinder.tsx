'use client';

import { useState, useEffect } from 'react';
import { Search, ArrowRight, Sparkles, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';
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
    similarity: number;
  }>;
  suggestions: TopicSuggestion[];
  gaps: ResearchGap[];
  totalSimilarPapers: number;
}

export default function HeroTopicFinder({ variant }: HeroTopicFinderProps) {
  const [topic, setTopic] = useState('');
  const [projectType, setProjectType] = useState<'essay' | 'thesis' | 'research' | 'journal'>('thesis');
  const [methodology, setMethodology] = useState<'qualitative' | 'quantitative' | 'mixed methods' | ''>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [result, setResult] = useState<TopicResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    trackLeadMagnet.view('topic', variant);
  }, [variant]);

  const handleAnalyze = async () => {
    if (!topic.trim()) {
      setError('Please enter a research topic');
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
        timestamp: Date.now(),
        expires: Date.now() + 3600 * 1000,
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to analyze. Please try again.');
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
    if (score >= 80) return 'Highly Unique';
    if (score >= 60) return 'Moderately Unique';
    return 'Needs Refinement';
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
          Find Your Unique Research Topic
        </span>
      </div>

      {!result ? (
        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] block">
                Research Topic or Field
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., climate change adaptation, machine learning in healthcare"
                className="w-full px-4 py-3 border-[3px] border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--background))] text-sm uppercase tracking-[0.1em] focus:outline-none focus:border-[hsl(var(--primary))]"
                onKeyDown={(e) => e.key === 'Enter' && !isAnalyzing && handleAnalyze()}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] block">
                  Project Type
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as any)}
                  className="w-full px-3 py-2 border-[2px] border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--background))] text-xs uppercase tracking-[0.1em] focus:outline-none focus:border-[hsl(var(--primary))]"
                >
                  <option value="thesis">Thesis</option>
                  <option value="essay">Essay</option>
                  <option value="research">Research Paper</option>
                  <option value="journal">Journal Article</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] block">
                  Methodology (Optional)
                </label>
                <select
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value as any)}
                  className="w-full px-3 py-2 border-[2px] border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--background))] text-xs uppercase tracking-[0.1em] focus:outline-none focus:border-[hsl(var(--primary))]"
                >
                  <option value="">Any</option>
                  <option value="qualitative">Qualitative</option>
                  <option value="quantitative">Quantitative</option>
                  <option value="mixed methods">Mixed Methods</option>
                </select>
              </div>
            </div>

            {error && (
              <p className="text-[10px] uppercase tracking-[0.18em] text-red-500 text-center">
                {error}
              </p>
            )}

            <Button
              onClick={handleAnalyze}
              className="w-full py-3"
              disabled={isAnalyzing || !topic.trim()}
            >
              {isAnalyzing ? 'Finding Unique Topics...' : 'Find Unique Topics'}
              {!isAnalyzing && <Search size={16} className="ml-2" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 space-y-4">
          {/* Uniqueness Score - Primary Focus */}
          <div className="text-center space-y-2">
            <p className="text-[9px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Topic Uniqueness Score
            </p>
            <div className="relative inline-flex items-center justify-center">
              <div className={cn('text-4xl font-bold', getUniquenessColor(result.uniquenessScore))}>
                {result.uniquenessScore}%
              </div>
            </div>
            <p className={cn('text-xs uppercase tracking-[0.2em] font-semibold', getUniquenessColor(result.uniquenessScore))}>
              {getUniquenessLabel(result.uniquenessScore)}
            </p>
            {/* Progress bar */}
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
              <p className="text-sm font-bold">{result.totalSimilarPapers}</p>
              <p className="text-[8px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">Similar Papers</p>
            </div>
            <div className="text-center border-l-[2px] border-[hsl(var(--border-strong))]">
              <p className="text-sm font-bold">{result.suggestions.length}</p>
              <p className="text-[8px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">Unique Angles</p>
            </div>
          </div>

          {/* Top Suggestion Preview */}
          {result.suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="text-[hsl(var(--primary))]" size={14} />
                <p className="text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] font-semibold">
                  Top Unique Topic Suggestion
                </p>
              </div>
              <div className="border-[2px] border-[hsl(var(--border-strong))] rounded p-3 bg-[hsl(var(--surface-muted))]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] mb-2">
                  {result.suggestions[0].title}
                </p>
                <p className="text-[10px] uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2">
                  {result.suggestions[0].researchQuestion}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle2 className="text-green-600" size={12} />
                  <span className="text-[9px] uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
                    {result.suggestions[0].whyUnique}
                  </span>
                </div>
              </div>
              {result.suggestions.length > 1 && (
                <p className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] text-center">
                  +{result.suggestions.length - 1} more unique topic suggestions
                </p>
              )}
            </div>
          )}

          {/* Research Gaps Preview */}
          {result.gaps.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] font-semibold">
                Research Gaps Found
              </p>
              {result.gaps.slice(0, 2).map((gap, index) => (
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
                  )} size={14} />
                  <span className="text-[10px] uppercase tracking-[0.12em]">
                    {gap.description}
                  </span>
                </div>
              ))}
              {result.gaps.length > 2 && (
                <p className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] text-center">
                  +{result.gaps.length - 2} more research gaps
                </p>
              )}
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={handleGetFullResultsClick}
            className="w-full py-3"
          >
            {result.uniquenessScore < 80 ? 'Get All Unique Topics & Gaps' : 'Create This Project in Akọ̀wé'}
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
