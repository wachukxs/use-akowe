'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, ArrowRight, BookOpen, AlertTriangle, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import LeadMagnetEmailCapture from './LeadMagnetEmailCapture';
import { trackLeadMagnet } from '@/lib/gtag';
import { cn } from '@/lib/utils';

interface HeroImportToolProps {
  variant: 'control' | 'variant_a' | 'variant_b';
}

interface Gap {
  type: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

interface ImportResult {
  title: string;
  sections: Array<{ title: string; preview: string; wordCount: number }>;
  sectionCount: number;
  wordCount: number;
  citationCount: number;
  readinessScore: number;
  gaps: Gap[];
}

export default function HeroImportTool({ variant }: HeroImportToolProps) {
  const t = useTranslations('components.heroImportTool');
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    trackLeadMagnet.view('import', variant);
  }, [variant]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      trackLeadMagnet.fileUploaded('import', selectedFile.name.split('.').pop() || 'unknown');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const extension = droppedFile.name.split('.').pop()?.toLowerCase();
      if (!['docx', 'pdf', 'txt'].includes(extension || '')) {
        setError(t('errorFileType'));
        return;
      }
      setFile(droppedFile);
      setError('');
      trackLeadMagnet.fileUploaded('import', extension || 'unknown');
    }
  };

  // Run analysis immediately - no email required first
  const handleAnalyze = async () => {
    if (!file) {
      setError(t('errorUploadFile'));
      return;
    }

    setError('');
    setIsAnalyzing(true);
    setResult(null);
    trackLeadMagnet.scanStarted('import');

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/tools/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('analysisFailed'));
      }

      const data = await response.json();
      setResult(data);
      trackLeadMagnet.resultViewed('import', data.readinessScore);

      // Store content for continuation after signup
      sessionStorage.setItem('lead_magnet_content', JSON.stringify({
        type: 'import',
        result: data,
        fileName: file.name,
        timestamp: Date.now(),
        expires: Date.now() + 3600 * 1000,
      }));
    } catch (err: any) {
      setError(err.message || t('analysisFailed'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Show email capture when user clicks "Fix Issues"
  const handleGetFullReportClick = () => {
    trackLeadMagnet.signupClicked('import');
    setShowEmailCapture(true);
  };

  const handleEmailSubmit = async (email: string) => {
    // Capture lead
    await fetch('/api/leads/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        source: 'import',
        variant,
        metadata: {
          fileType: file?.name.split('.').pop(),
          fileName: file?.name,
          readinessScore: result?.readinessScore,
        },
      }),
    });

    trackLeadMagnet.emailCaptured('import');
    
    // Redirect to signup
    window.location.href = `/auth/signup?from=import&email=${encodeURIComponent(email)}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return t('scoreGood');
    if (score >= 60) return t('scoreNeedsWork');
    return t('scoreAtRisk');
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen size={16} className="text-[hsl(var(--primary))]" />
        <span className="text-[10px] uppercase tracking-[0.28em] font-semibold text-[hsl(var(--muted-foreground))]">
          {t('label')}
        </span>
      </div>

      {!result ? (
        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4">
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className={cn(
                'border-[3px] border-dashed border-[hsl(var(--border-strong))] rounded-[var(--radius)] p-6 text-center cursor-pointer transition-colors',
                'hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-muted))]',
                file && 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              {file ? (
                <div className="space-y-2">
                  <FileText className="mx-auto text-[hsl(var(--primary))]" size={32} />
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">{file.name}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  >
                    {t('remove')}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto text-[hsl(var(--muted-foreground))]" size={32} />
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                    {t('dropThesis')}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                    {t('fileFormats')}
                  </p>
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
              disabled={isAnalyzing || !file}
            >
              {isAnalyzing ? t('analyzing') : t('analyzeDocument')}
              {!isAnalyzing && <ArrowRight size={16} className="ml-2" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 space-y-4">
          {/* Readiness Score - Primary Focus */}
          <div className="text-center space-y-2">
            <p className="text-[9px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              {t('thesisReadinessScore')}
            </p>
            <div className="relative inline-flex items-center justify-center">
              <div className={cn('text-4xl font-bold', getScoreColor(result.readinessScore))}>
                {result.readinessScore}%
              </div>
            </div>
            <p className={cn('text-xs uppercase tracking-[0.2em] font-semibold', getScoreColor(result.readinessScore))}>
              {getScoreLabel(result.readinessScore)}
            </p>
            {/* Progress bar */}
            <div className="w-full h-2 bg-[hsl(var(--surface-muted))] rounded-full overflow-hidden">
              <div 
                className={cn('h-full transition-all', getScoreBg(result.readinessScore))}
                style={{ width: `${result.readinessScore}%` }}
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y-[2px] border-[hsl(var(--border-strong))]">
            <div className="text-center">
              <p className="text-sm font-bold">{result.wordCount.toLocaleString()}</p>
              <p className="text-[8px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">{t('words')}</p>
            </div>
            <div className="text-center border-x-[2px] border-[hsl(var(--border-strong))]">
              <p className="text-sm font-bold">{result.sectionCount}</p>
              <p className="text-[8px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">{t('sections')}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">{result.citationCount}</p>
              <p className="text-[8px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">{t('citations')}</p>
            </div>
          </div>

          {/* Gaps - The Anxiety Trigger */}
          {result.gaps.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] font-semibold">
                {t('issuesFound')}
              </p>
              {result.gaps.slice(0, 2).map((gap, index) => (
                <div 
                  key={index} 
                  className={cn(
                    'flex items-start gap-2 border-[2px] rounded p-2',
                    gap.severity === 'high' 
                      ? 'border-red-300 bg-red-50' 
                      : gap.severity === 'medium'
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))]'
                  )}
                >
                  {gap.severity === 'high' ? (
                    <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={14} />
                  ) : (
                    <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={14} />
                  )}
                  <span className="text-[10px] uppercase tracking-[0.12em]">
                    {gap.message}
                  </span>
                </div>
              ))}
              {result.gaps.length > 2 && (
                <p className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] text-center">
                  {t('moreIssuesToFix', { count: result.gaps.length - 2 })}
                </p>
              )}
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={handleGetFullReportClick}
            className="w-full py-3"
          >
            {result.gaps.length > 0 ? t('fixInAkowe') : t('continueInAkowe')}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      )}

      <LeadMagnetEmailCapture
        isOpen={showEmailCapture}
        onClose={() => setShowEmailCapture(false)}
        onSubmit={handleEmailSubmit}
        source="import"
        isLoading={isAnalyzing}
      />
    </div>
  );
}
