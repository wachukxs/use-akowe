'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, FileText, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import Button from '@/components/ui/Button';
import LeadMagnetEmailCapture from './LeadMagnetEmailCapture';
import { trackLeadMagnet } from '@/lib/gtag';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';

interface ImportLeadMagnetProps {
  variant: 'control' | 'variant_a' | 'variant_b';
}

interface ImportResult {
  title: string;
  sections: Array<{ title: string; preview: string }>;
  sectionCount: number;
  wordCount: number;
  citationCount: number;
}

export default function ImportLeadMagnet({ variant }: ImportLeadMagnetProps) {
  const t = useTranslations('components.importLeadMagnet');
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [capturedEmail, setCapturedEmail] = useState('');
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

  const handleAnalyze = async () => {
    if (!file) {
      setError(t('errorUploadFile'));
      return;
    }

    setError('');
    trackLeadMagnet.scanStarted('import');
    setShowEmailCapture(true);
  };

  const handleEmailSubmit = async (email: string) => {
    setCapturedEmail(email);
    setIsAnalyzing(true);

    try {
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
          },
        }),
      });

      trackLeadMagnet.emailCaptured('import');

      // Analyze file
      const formData = new FormData();
      formData.append('file', file!);
      
      const response = await fetch('/api/tools/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setResult(data);
      trackLeadMagnet.resultViewed('import', data.sectionCount);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setShowEmailCapture(false);
    }
  };

  const handleSignupClick = () => {
    trackLeadMagnet.signupClicked('import');
  };

  return (
    <section className="max-w-7xl mx-auto py-12 sm:py-16 border-t-4 border-[hsl(var(--border-strong))]">
      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
          <BookOpen size={16} />
          <span className="text-[10px] uppercase tracking-[0.28em] font-semibold">{t('freeTool')}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em]">
          {t('title')}
        </h2>
        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      {!result ? (
        <div className="max-w-3xl mx-auto">
          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 sm:p-6">
            <div className="space-y-4">
              {/* File upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className={cn(
                  'border-[3px] border-dashed border-[hsl(var(--border-strong))] rounded-(--radius) p-8 sm:p-12 text-center cursor-pointer transition-colors',
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
                  <div className="space-y-3">
                    <FileText className="mx-auto text-[hsl(var(--primary))]" size={48} />
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em]">{file.name}</p>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    >
                      {t('removeFile')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="mx-auto text-[hsl(var(--muted-foreground))]" size={48} />
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em]">
                        {t('dragDrop')}
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-2">
                        {t('orClick')}
                      </p>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                      {t('supports')}
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-xs uppercase tracking-[0.18em] text-red-500 text-center">
                  {error}
                </p>
              )}

              <Button
                onClick={handleAnalyze}
                className="w-full py-4"
                disabled={isAnalyzing || !file}
              >
                {isAnalyzing ? t('analyzing') : t('analyzeButton')}
                {!isAnalyzing && <ArrowRight size={18} className="ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Results */}
          <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 sm:p-8">
            {/* Title */}
            <div className="text-center mb-8">
              <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-[0.12em]">
                {result.title}
              </h3>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{result.wordCount.toLocaleString()}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">{t('words')}</p>
                </div>
                <div className="w-[3px] h-8 bg-[hsl(var(--border-strong))]" />
                <div className="text-center">
                  <p className="text-2xl font-bold">{result.sectionCount}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">{t('sections')}</p>
                </div>
                <div className="w-[3px] h-8 bg-[hsl(var(--border-strong))]" />
                <div className="text-center">
                  <p className="text-2xl font-bold">{result.citationCount}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">{t('citations')}</p>
                </div>
              </div>
            </div>

            {/* Sections preview */}
            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em]">
                {t('detectedSections')}
              </h4>
              {result.sections.slice(0, 3).map((section, index) => (
                <div
                  key={index}
                  className="border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) p-4 bg-[hsl(var(--surface-muted))]"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-[0.16em] font-semibold">
                        {section.title}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">
                        {section.preview}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Locked content indicator */}
            {result.sectionCount > 3 && (
              <div className="border-[3px] border-dashed border-[hsl(var(--border-strong))] rounded-(--radius) p-6 text-center bg-[hsl(var(--surface-muted))] mb-6">
                <p className="text-sm uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  {t('moreSections', { count: result.sectionCount - 3 })}
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-2">
                  {t('signUpToImport')}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="text-center space-y-4">
              <Link 
                href={`/auth/signup?from=import&email=${encodeURIComponent(capturedEmail)}`}
                onClick={handleSignupClick}
              >
                <Button className="px-8 py-4">
                  {t('continueInAkowe')}
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                {t('noCardNote')}
              </p>
            </div>
          </div>
        </div>
      )}

      <LeadMagnetEmailCapture
        isOpen={showEmailCapture}
        onClose={() => setShowEmailCapture(false)}
        onSubmit={handleEmailSubmit}
        source="import"
        isLoading={isAnalyzing}
      />
    </section>
  );
}
