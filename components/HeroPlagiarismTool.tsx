'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, FileText, AlertTriangle, CheckCircle2, ArrowRight, Shield, Lock } from 'lucide-react';
import Button from '@/components/ui/Button';
import LeadMagnetEmailCapture from './LeadMagnetEmailCapture';
import { trackLeadMagnet } from '@/lib/gtag';
import { cn } from '@/lib/utils';

interface HeroPlagiarismToolProps {
  variant: 'control' | 'variant_a' | 'variant_b';
}

interface CheckPerformed {
  name: string;
  count: number | null;
  status: 'pass' | 'issues' | 'locked';
}

interface PlagiarismResult {
  riskScore: number;
  previewIssues: Array<{ text: string; type: string; suggestion: string }>;
  totalIssues: number;
  wordCount: number;
  summary: {
    citationIssues: number;
    aiPatterns: number;
    repetitionIssues: number;
    writingIssues: number;
  };
  checksPerformed: CheckPerformed[];
}

export default function HeroPlagiarismTool({ variant }: HeroPlagiarismToolProps) {
  const t = useTranslations('components');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTrackedPaste = useRef(false);

  useEffect(() => {
    trackLeadMagnet.view('plagiarism', variant);
  }, [variant]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    // Track only once when crossing 50 char threshold
    if (newText.length > 50 && !hasTrackedPaste.current) {
      hasTrackedPaste.current = true;
      trackLeadMagnet.textPasted('plagiarism', newText.length);
    } else if (newText.length <= 50) {
      hasTrackedPaste.current = false; // Reset if user deletes text
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setText('');
      setError('');
      trackLeadMagnet.fileUploaded('plagiarism', selectedFile.name.split('.').pop() || 'unknown');
    }
  };

  // Run the scan immediately - no email required
  const handleAnalyze = async () => {
    if (!text.trim() && !file) {
      setError(t('plagiarismTool.errorPasteOrFile'));
      return;
    }

    if (text.trim() && text.trim().length < 50) {
      setError(t('plagiarismTool.errorMinChars'));
      return;
    }

    setError('');
    setIsAnalyzing(true);
    trackLeadMagnet.scanStarted('plagiarism');

    try {
      let response;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        response = await fetch('/api/tools/plagiarism', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch('/api/tools/plagiarism', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setResult(data);
      trackLeadMagnet.resultViewed('plagiarism', data.riskScore);
      
      // Store content for continuation after signup
      // Store both text (if pasted) and result (for file uploads)
      sessionStorage.setItem('lead_magnet_content', JSON.stringify({
        type: 'plagiarism',
        text: text.trim() || null,
        result: data, // Store result for file-based checks
        fileName: file?.name || null,
        timestamp: Date.now()
      }));
    } catch (err: any) {
      setError(err.message || t('plagiarismTool.analysisFailed'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Email capture happens when user wants full report
  const handleGetFullReport = () => {
    trackLeadMagnet.signupClicked('plagiarism');
    setShowEmailCapture(true);
  };

  const handleEmailSubmit = async (email: string) => {
    try {
      await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'plagiarism',
          variant,
          metadata: file 
            ? { fileType: file.name.split('.').pop(), fileName: file.name }
            : { charCount: text.length },
        }),
      });

      trackLeadMagnet.emailCaptured('plagiarism');
      setShowEmailCapture(false);
      
      // Redirect to signup with email pre-filled
      window.location.href = `/auth/signup?from=plagiarism&email=${encodeURIComponent(email)}`;
    } catch (err) {
      console.error('Failed to capture email:', err);
      setShowEmailCapture(false);
      window.location.href = `/auth/signup?from=plagiarism&email=${encodeURIComponent(email)}`;
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 15) return 'text-green-600';
    if (score < 35) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBgColor = (score: number) => {
    if (score < 15) return 'bg-green-50 border-green-200';
    if (score < 35) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getRiskLabel = (score: number) => {
    if (score < 15) return t('plagiarismTool.riskLow');
    if (score < 35) return t('plagiarismTool.riskMedium');
    return t('plagiarismTool.riskHigh');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-[hsl(var(--primary))]" />
        <span className="text-[10px] uppercase tracking-[0.28em] font-semibold text-[hsl(var(--muted-foreground))]">
          {t('plagiarismTool.label')}
        </span>
      </div>

      {!result ? (
        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4">
          <div className="space-y-3">
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder={t('plagiarismTool.placeholder')}
              className="w-full h-28 px-3 py-2 border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm tracking-wide resize-none focus:outline-none focus:border-[hsl(var(--primary))]"
              disabled={!!file || isAnalyzing}
            />

            <div className="flex items-center gap-3">
              <div className="flex-1 h-[2px] bg-[hsl(var(--border-strong))]" />
              <span className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">{t('plagiarismTool.or')}</span>
              <div className="flex-1 h-[2px] bg-[hsl(var(--border-strong))]" />
            </div>

            <div
              onClick={() => !text && fileInputRef.current?.click()}
              className={cn(
                'border-[2px] border-dashed border-[hsl(var(--border-strong))] rounded-(--radius) p-3 text-center cursor-pointer transition-colors',
                text ? 'opacity-50 cursor-not-allowed' : 'hover:border-[hsl(var(--primary))]',
                file && 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf,.txt"
                onChange={handleFileSelect}
                className="hidden"
                disabled={!!text}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="text-[hsl(var(--primary))]" size={16} />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">{file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] ml-2"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Upload size={16} className="text-[hsl(var(--muted-foreground))]" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                    {t('plagiarismTool.uploadHint')}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <p className="text-[10px] uppercase tracking-[0.18em] text-red-500 text-center">
                {error}
              </p>
            )}

            <Button
              onClick={handleAnalyze}
              className="w-full py-3"
              disabled={isAnalyzing || (!text.trim() && !file)}
            >
              {isAnalyzing ? t('plagiarismTool.analyzing') : t('plagiarismTool.checkNow')}
              {!isAnalyzing && <ArrowRight size={16} className="ml-2" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 space-y-4">
          {/* Risk Score Header */}
          <div className={cn('text-center p-3 rounded border-2', getRiskBgColor(result.riskScore))}>
            <div className={cn('text-4xl font-bold', getRiskColor(result.riskScore))}>
              {result.riskScore}%
            </div>
            <p className={cn('text-xs uppercase tracking-[0.2em] font-semibold', getRiskColor(result.riskScore))}>
              {getRiskLabel(result.riskScore)}
            </p>
          </div>

          {/* Checks Performed - Always show what we checked */}
          <div className="space-y-1.5">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] font-semibold">
              {t('plagiarismTool.checksPerformed')}
            </p>
            {result.checksPerformed?.map((check, index) => (
              <div key={index} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em]">
                {check.status === 'pass' && (
                  <>
                    <CheckCircle2 className="text-green-500 flex-shrink-0" size={12} />
                    <span className="text-green-700">{check.name}</span>
                    <span className="text-green-600 font-semibold ml-auto">{t('plagiarismTool.clean')}</span>
                  </>
                )}
                {check.status === 'issues' && (
                  <>
                    <AlertTriangle className="text-yellow-500 flex-shrink-0" size={12} />
                    <span className="text-yellow-700">{check.name}</span>
                    <span className="text-yellow-600 font-semibold ml-auto">{t('plagiarismTool.found', { count: check.count ?? 0 })}</span>
                  </>
                )}
                {check.status === 'locked' && (
                  <>
                    <Lock className="text-[hsl(var(--muted-foreground))] flex-shrink-0" size={12} />
                    <span className="text-[hsl(var(--muted-foreground))]">{check.name}</span>
                    <span className="text-[hsl(var(--primary))] font-semibold ml-auto">{t('plagiarismTool.signUp')}</span>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* One Example Issue with Suggestion */}
          {result.previewIssues.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] font-semibold">
                {t('plagiarismTool.exampleIssueFound')}
              </p>
              <div className="border-[2px] border-[hsl(var(--border-strong))] rounded p-3 bg-[hsl(var(--surface-muted))]">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={14} />
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.14em] font-semibold">{result.previewIssues[0].type}</p>
                    <p className="text-[9px] tracking-[0.08em] text-[hsl(var(--muted-foreground))] italic">
                      &quot;{result.previewIssues[0].text}&quot;
                    </p>
                    <p className="text-[9px] uppercase tracking-[0.12em] text-[hsl(var(--primary))] font-semibold">
                      → {result.previewIssues[0].suggestion}
                    </p>
                  </div>
                </div>
              </div>
              {result.totalIssues > 1 && (
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] text-center">
                  {t('plagiarismTool.moreIssuesToFix', { count: result.totalIssues - 1 })}
                </p>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="space-y-2">
            <Button onClick={handleGetFullReport} className="w-full py-3">
              {t('plagiarismTool.getFullReport')}
              <ArrowRight size={16} className="ml-2" />
            </Button>
            <p className="text-[8px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] text-center">
              {t('plagiarismTool.seeAllIssues', { count: result.totalIssues })}
            </p>
          </div>
        </div>
      )}

      <LeadMagnetEmailCapture
        isOpen={showEmailCapture}
        onClose={() => setShowEmailCapture(false)}
        onSubmit={handleEmailSubmit}
        source="plagiarism"
        isLoading={false}
      />
    </div>
  );
}
