'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle, Lock, BookOpen } from 'lucide-react';
import Button from '@/components/ui/Button';
import LeadMagnetEmailCapture from './LeadMagnetEmailCapture';
import { trackLeadMagnet } from '@/lib/gtag';

interface ReferenceResult {
  raw: string;
  index: number;
  doi?: string;
  status: 'valid' | 'unresolvable' | 'no-doi' | 'malformed';
  resolvedTitle?: string;
  resolvedYear?: number;
  resolvedAuthors?: string[];
  issues: string[];
}

interface CheckerResult {
  totalParsed: number;
  processed: ReferenceResult[];
  lockedCount: number;
  summary: {
    valid: number;
    issues: number;
    noDoi: number;
    unresolvable: number;
    malformed: number;
  };
  isLimited: boolean;
}

const PLACEHOLDER = `Paste your reference list here. For example:

Smith, J., & Jones, A. (2021). Machine learning in healthcare: A systematic review. Journal of Medical AI, 14(2), 45–67. https://doi.org/10.1000/xyz123

Brown, R. (2019). Qualitative methods in social research. Oxford University Press.

[1] Chen, L. et al. (2022). Deep learning for NLP. Nature, 601, 112–118.`;

export default function HeroReferenceChecker() {
  const [text, setText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<CheckerResult | null>(null);
  const [error, setError] = useState('');
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const hasTrackedPaste = useRef(false);

  useEffect(() => {
    trackLeadMagnet.view('reference_checker', 'control');
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    if (val.length > 100 && !hasTrackedPaste.current) {
      hasTrackedPaste.current = true;
      trackLeadMagnet.textPasted('reference_checker', val.length);
    } else if (val.length <= 100) {
      hasTrackedPaste.current = false;
    }
  };

  const handleCheck = async () => {
    if (!text.trim()) {
      setError('Paste your reference list above');
      return;
    }
    setError('');
    setIsChecking(true);
    trackLeadMagnet.scanStarted('reference_checker');

    try {
      const res = await fetch('/api/tools/reference-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Check failed');
      }

      const data: CheckerResult = await res.json();
      setResult(data);
      trackLeadMagnet.resultViewed('reference_checker', data.summary.issues);

      sessionStorage.setItem('lead_magnet_content', JSON.stringify({
        type: 'reference_checker',
        text: text.trim(),
        result: data,
        timestamp: Date.now(),
      }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsChecking(false);
    }
  };

  const handleGetFullReport = () => {
    trackLeadMagnet.signupClicked('reference_checker');
    setShowEmailCapture(true);
  };

  const handleEmailSubmit = async (email: string) => {
    try {
      await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'reference_checker',
          variant: 'control',
          metadata: { refCount: result?.totalParsed },
        }),
      });
      trackLeadMagnet.emailCaptured('reference_checker');
    } catch {
      // continue
    }
    setShowEmailCapture(false);
    window.location.href = `/auth/signup?from=reference_checker&email=${encodeURIComponent(email)}`;
  };

  const statusIcon = (status: ReferenceResult['status']) => {
    if (status === 'valid') return <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />;
    if (status === 'unresolvable') return <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />;
    return <AlertTriangle size={14} className="text-yellow-500 shrink-0 mt-0.5" />;
  };

  const statusLabel = (status: ReferenceResult['status']) => {
    if (status === 'valid') return <span className="text-green-600">Verified</span>;
    if (status === 'unresolvable') return <span className="text-red-600">Invalid DOI</span>;
    if (status === 'no-doi') return <span className="text-yellow-600">No DOI</span>;
    return <span className="text-yellow-600">Issues</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen size={16} className="text-[hsl(var(--primary))]" />
        <span className="text-[10px] uppercase tracking-[0.28em] font-semibold text-[hsl(var(--muted-foreground))]">
          Free Reference Checker
        </span>
      </div>

      {!result ? (
        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 space-y-3">
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder={PLACEHOLDER}
            rows={8}
            className="w-full px-3 py-2 border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm tracking-wide resize-none focus:outline-none focus:border-[hsl(var(--primary))] font-mono"
            disabled={isChecking}
          />

          {error && (
            <p className="text-[10px] uppercase tracking-[0.18em] text-red-500 text-center">{error}</p>
          )}

          <Button
            onClick={handleCheck}
            className="w-full py-3"
            disabled={isChecking || !text.trim()}
          >
            {isChecking ? 'Checking references…' : 'Check my references'}
            {!isChecking && <ArrowRight size={16} className="ml-2" />}
          </Button>

          <p className="text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] text-center">
            Checks against Crossref · Free for up to 5 references
          </p>
        </div>
      ) : (
        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="border-2 border-green-200 bg-green-50 p-2 rounded">
              <p className="text-lg font-bold text-green-700">{result.summary.valid}</p>
              <p className="text-[9px] uppercase tracking-[0.16em] text-green-600">Verified</p>
            </div>
            <div className={`border-2 p-2 rounded ${result.summary.unresolvable > 0 ? 'border-red-200 bg-red-50' : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))]'}`}>
              <p className={`text-lg font-bold ${result.summary.unresolvable > 0 ? 'text-red-700' : 'text-[hsl(var(--muted-foreground))]'}`}>{result.summary.unresolvable}</p>
              <p className={`text-[9px] uppercase tracking-[0.16em] ${result.summary.unresolvable > 0 ? 'text-red-600' : 'text-[hsl(var(--muted-foreground))]'}`}>Invalid DOI</p>
            </div>
            <div className={`border-2 p-2 rounded ${result.summary.noDoi > 0 || result.summary.malformed > 0 ? 'border-yellow-200 bg-yellow-50' : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))]'}`}>
              <p className={`text-lg font-bold ${result.summary.noDoi > 0 || result.summary.malformed > 0 ? 'text-yellow-700' : 'text-[hsl(var(--muted-foreground))]'}`}>{result.summary.noDoi + result.summary.malformed}</p>
              <p className={`text-[9px] uppercase tracking-[0.16em] ${result.summary.noDoi > 0 || result.summary.malformed > 0 ? 'text-yellow-600' : 'text-[hsl(var(--muted-foreground))]'}`}>Need Review</p>
            </div>
          </div>

          {/* Per-reference results */}
          <div className="space-y-2">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] font-semibold">
              Results ({result.processed.length} of {result.totalParsed} checked)
            </p>
            {result.processed.map((ref) => (
              <div key={ref.index} className="border-[2px] border-[hsl(var(--border-strong))] rounded p-2.5 space-y-1">
                <div className="flex items-start gap-2">
                  {statusIcon(ref.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[9px] uppercase tracking-[0.16em] font-semibold text-[hsl(var(--muted-foreground))]">
                        Ref {ref.index}
                      </span>
                      <span className="text-[9px] uppercase tracking-[0.14em] font-bold">
                        {statusLabel(ref.status)}
                      </span>
                    </div>
                    {ref.status === 'valid' && ref.resolvedTitle ? (
                      <p className="text-[10px] tracking-[0.06em] text-[hsl(var(--foreground))] line-clamp-1">
                        {ref.resolvedTitle}
                        {ref.resolvedYear ? ` (${ref.resolvedYear})` : ''}
                      </p>
                    ) : (
                      <p className="text-[10px] tracking-[0.06em] text-[hsl(var(--muted-foreground))] line-clamp-1 italic">
                        {ref.raw}
                      </p>
                    )}
                    {ref.issues.length > 0 && (
                      <p className="text-[9px] text-yellow-700 tracking-[0.06em] mt-0.5">
                        → {ref.issues[0]}
                      </p>
                    )}
                    {ref.status === 'unresolvable' && ref.doi && (
                      <p className="text-[9px] text-red-600 font-mono mt-0.5 truncate">
                        doi:{ref.doi}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Locked references */}
            {result.lockedCount > 0 && (
              <div className="border-[2px] border-dashed border-[hsl(var(--border-strong))] rounded p-3 flex items-center gap-2">
                <Lock size={14} className="text-[hsl(var(--muted-foreground))] shrink-0" />
                <p className="text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
                  {result.lockedCount} more reference{result.lockedCount !== 1 ? 's' : ''} — sign up to check all
                </p>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="space-y-2">
            <Button onClick={handleGetFullReport} className="w-full py-3">
              Fix all {result.totalParsed} references in Akowe
              <ArrowRight size={16} className="ml-2" />
            </Button>
            <p className="text-[9px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] text-center">
              Auto-format · verify · insert in one click
            </p>
          </div>

          <button
            onClick={() => { setResult(null); setText(''); }}
            className="w-full text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            Check a different list
          </button>
        </div>
      )}

      <LeadMagnetEmailCapture
        isOpen={showEmailCapture}
        onClose={() => setShowEmailCapture(false)}
        onSubmit={handleEmailSubmit}
        source="import"
        isLoading={false}
      />
    </div>
  );
}
