'use client';

import { useState, useRef } from 'react';
import { FileText, Upload, AlertTriangle, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { trackLeadMagnet } from '@/lib/gtag';
import LeadMagnetEmailCapture from './LeadMagnetEmailCapture';

interface ImportResult {
  title: string;
  sectionCount: number;
  wordCount: number;
  citationCount: number;
  readinessScore: number;
  gaps: Array<{
    type: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
  }>;
}

export default function InlineImportTool() {
  const t = useTranslations('components.inlineImportTool');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setIsAnalyzing(true);
    trackLeadMagnet.fileUploaded('import', file.type);
    trackLeadMagnet.scanStarted('import');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/tools/import', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(data);
        trackLeadMagnet.resultViewed('import', data.readinessScore);
        
        sessionStorage.setItem('lead_magnet_content', JSON.stringify({
          type: 'import',
          result: data,
          fileName: file.name,
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
    trackLeadMagnet.emailCaptured('import');
    
    try {
      await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'import',
          variant: 'faq_inline',
          metadata: { fileName },
        }),
      });
      
      trackLeadMagnet.signupClicked('import');
      router.push(`/auth/signup?email=${encodeURIComponent(email)}&from=import`);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg my-8">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={20} className="text-[hsl(var(--primary))]" />
        <h3 className="text-lg font-bold uppercase tracking-[0.1em]">
          {t('title')}
        </h3>
      </div>
      
      {!result ? (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.pdf,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="w-full border-[3px] border-dashed border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] p-8 text-center hover:bg-[hsl(var(--surface-muted))] transition-colors"
          >
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={32} className="animate-spin text-[hsl(var(--primary))]" />
                <span className="text-sm uppercase tracking-[0.14em]">{t('analyzingFile', { fileName })}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload size={32} className="text-[hsl(var(--muted-foreground))]" />
                <span className="text-sm uppercase tracking-[0.14em]">{t('uploadCta')}</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {t('uploadSubtext')}
                </span>
              </div>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Readiness Score */}
          <div className="flex items-center justify-between p-4 bg-[hsl(var(--background))] border-[2px] border-[hsl(var(--border-strong))] rounded">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                {t('thesisReadiness')}
              </p>
              <p className={`text-3xl font-bold ${getScoreColor(result.readinessScore)}`}>
                {result.readinessScore}%
              </p>
            </div>
            {result.readinessScore >= 80 ? (
              <CheckCircle size={32} className="text-green-500" />
            ) : (
              <AlertTriangle size={32} className={getScoreColor(result.readinessScore)} />
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-[hsl(var(--background))] rounded">
              <p className="font-bold">{result.sectionCount}</p>
              <p className="text-[hsl(var(--muted-foreground))]">{t('sections')}</p>
            </div>
            <div className="p-2 bg-[hsl(var(--background))] rounded">
              <p className="font-bold">{result.wordCount.toLocaleString()}</p>
              <p className="text-[hsl(var(--muted-foreground))]">{t('words')}</p>
            </div>
            <div className="p-2 bg-[hsl(var(--background))] rounded">
              <p className="font-bold">{result.citationCount}</p>
              <p className="text-[hsl(var(--muted-foreground))]">{t('citations')}</p>
            </div>
          </div>

          {/* Top Gap */}
          {result.gaps.length > 0 && (
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm">
              <p className="font-semibold text-yellow-800">
                {result.gaps[0].message}
              </p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => setShowEmailCapture(true)}
            className="w-full inline-flex items-center justify-center gap-2 border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 py-3 font-semibold uppercase tracking-[0.12em] text-sm"
          >
            {t('fixInAkowe')}
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      <LeadMagnetEmailCapture
        isOpen={showEmailCapture}
        onClose={() => setShowEmailCapture(false)}
        onSubmit={handleEmailSubmit}
        source="import"
        isLoading={isSubmitting}
      />
    </div>
  );
}
