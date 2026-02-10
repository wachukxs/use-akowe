'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { trackLeadMagnet } from '@/lib/gtag';
import LeadMagnetEmailCapture from './LeadMagnetEmailCapture';

interface PlagiarismResult {
  riskScore: number;
  previewIssues: Array<{
    type: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  totalIssues: number;
  summary: {
    citationIssues: number;
    aiPatterns: number;
    repetitionIssues: number;
    writingIssues: number;
  };
}

export default function InlinePlagiarismTool() {
  const t = useTranslations('components.inlinePlagiarismTool');
  const router = useRouter();
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnalyze = async () => {
    if (!text.trim() || text.length < 50) return;
    
    setIsAnalyzing(true);
    trackLeadMagnet.scanStarted('plagiarism');
    
    try {
      const response = await fetch('/api/tools/plagiarism', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(data);
        trackLeadMagnet.resultViewed('plagiarism', data.riskScore);
        
        sessionStorage.setItem('lead_magnet_content', JSON.stringify({
          type: 'plagiarism',
          text,
          result: data,
          timestamp: Date.now(),
        }));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEmailSubmit = async (email: string) => {
    setIsSubmitting(true);
    trackLeadMagnet.emailCaptured('plagiarism');
    
    try {
      await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'plagiarism',
          variant: 'guide_inline',
          metadata: { charCount: text.length },
        }),
      });
      
      trackLeadMagnet.signupClicked('plagiarism');
      router.push(`/auth/signup?email=${encodeURIComponent(email)}&from=plagiarism`);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg my-8">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={20} className="text-[hsl(var(--primary))]" />
        <h3 className="text-lg font-bold uppercase tracking-[0.1em]">
          Try It: Check Your Text
        </h3>
      </div>
      
      {!result ? (
        <div className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('placeholder')}
            className="w-full h-32 p-4 border-[3px] border-[hsl(var(--border-strong))] rounded bg-[hsl(var(--background))] text-sm resize-none focus:outline-none focus:border-[hsl(var(--primary))]"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {text.length < 50 ? t('moreCharsNeeded', { count: 50 - text.length }) : t('readyToCheck')}
            </span>
            <button
              onClick={handleAnalyze}
              disabled={text.length < 50 || isAnalyzing}
              className="inline-flex items-center gap-2 border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 py-2.5 font-semibold uppercase tracking-[0.14em] text-sm disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Shield size={16} />
                  Check Now
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Risk Score */}
          <div className="flex items-center justify-between p-4 bg-[hsl(var(--background))] border-[2px] border-[hsl(var(--border-strong))] rounded">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                {t('riskScore')}
              </p>
              <p className={`text-3xl font-bold ${getRiskColor(result.riskScore)}`}>
                {result.riskScore}%
              </p>
            </div>
            {result.riskScore >= 40 ? (
              <AlertTriangle size={32} className={getRiskColor(result.riskScore)} />
            ) : (
              <CheckCircle size={32} className="text-green-500" />
            )}
          </div>

          {/* Preview Issue */}
          {result.previewIssues.length > 0 && (
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm">
              <p className="font-semibold text-yellow-800">
                {result.previewIssues[0].message}
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="text-xs text-[hsl(var(--muted-foreground))]">
            Found {result.totalIssues} total issues •
            {result.summary.citationIssues > 0 && ` ${result.summary.citationIssues} citation`}
            {result.summary.aiPatterns > 0 && ` ${result.summary.aiPatterns} AI pattern`}
          </div>

          {/* CTA */}
          <button
            onClick={() => setShowEmailCapture(true)}
            className="w-full inline-flex items-center justify-center gap-2 border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 py-3 font-semibold uppercase tracking-[0.12em] text-sm"
          >
            {t('getFullReport')}
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      <LeadMagnetEmailCapture
        isOpen={showEmailCapture}
        onClose={() => setShowEmailCapture(false)}
        onSubmit={handleEmailSubmit}
        source="plagiarism"
        isLoading={isSubmitting}
      />
    </div>
  );
}
