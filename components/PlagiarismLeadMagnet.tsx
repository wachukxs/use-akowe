'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, AlertTriangle, ArrowRight, Shield } from 'lucide-react';
import Button from '@/components/ui/Button';
import LeadMagnetEmailCapture from './LeadMagnetEmailCapture';
import { trackLeadMagnet } from '@/lib/gtag';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface PlagiarismLeadMagnetProps {
  variant: 'control' | 'variant_a' | 'variant_b';
}

interface PlagiarismResult {
  riskScore: number;
  previewIssues: Array<{ text: string; type: string; suggestion: string }>;
  totalIssues: number;
  wordCount: number;
}

export default function PlagiarismLeadMagnet({ variant }: PlagiarismLeadMagnetProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [error, setError] = useState('');
  const [capturedEmail, setCapturedEmail] = useState('');
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

  const handleAnalyze = async () => {
    if (!text.trim() && !file) {
      setError('Please paste text or upload a file');
      return;
    }

    if (text.trim() && text.trim().length < 50) {
      setError('Please enter at least 50 characters');
      return;
    }

    setError('');
    trackLeadMagnet.scanStarted('plagiarism');
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
          source: 'plagiarism',
          variant,
          metadata: file 
            ? { fileType: file.name.split('.').pop(), fileName: file.name }
            : { charCount: text.length },
        }),
      });

      trackLeadMagnet.emailCaptured('plagiarism');

      // Analyze text
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
    } catch (err: any) {
      setError(err.message || 'Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setShowEmailCapture(false);
    }
  };

  const handleSignupClick = () => {
    trackLeadMagnet.signupClicked('plagiarism');
  };

  const getRiskColor = (score: number) => {
    if (score < 15) return 'text-green-600';
    if (score < 35) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskLabel = (score: number) => {
    if (score < 15) return 'Low Risk';
    if (score < 35) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <section className="max-w-7xl mx-auto py-12 sm:py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
          <Shield size={16} />
          <span className="text-[10px] uppercase tracking-[0.28em] font-semibold">Free Tool</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em]">
          Check Your Text for Plagiarism
        </h2>
        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
          Paste your text or upload a document. Get instant feedback on potential issues.
        </p>
      </div>

      {!result ? (
        <div className="max-w-3xl mx-auto">
          <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 sm:p-6">
            {/* Text input */}
            <div className="space-y-4">
              <textarea
                value={text}
                onChange={handleTextChange}
                placeholder="Paste your text here (minimum 50 characters)..."
                className="w-full h-40 sm:h-48 px-4 py-3 border-[3px] border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--background))] text-sm tracking-wide resize-none focus:outline-none focus:border-[hsl(var(--primary))]"
                disabled={!!file || isAnalyzing}
              />

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-[3px] bg-[hsl(var(--border-strong))]" />
                <span className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">or</span>
                <div className="flex-1 h-[3px] bg-[hsl(var(--border-strong))]" />
              </div>

              {/* File upload */}
              <div
                onClick={() => !text && fileInputRef.current?.click()}
                className={cn(
                  'border-[3px] border-dashed border-[hsl(var(--border-strong))] rounded-[var(--radius)] p-6 text-center cursor-pointer transition-colors',
                  text ? 'opacity-50 cursor-not-allowed' : 'hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-muted))]',
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
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="text-[hsl(var(--primary))]" size={24} />
                    <div className="text-left">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em]">{file.name}</p>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="ml-4 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto text-[hsl(var(--muted-foreground))]" size={32} />
                    <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                      Upload .docx, .pdf, or .txt (max 10MB)
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
                disabled={isAnalyzing || (!text.trim() && !file)}
              >
                {isAnalyzing ? 'Analyzing...' : 'Check for Plagiarism'}
                {!isAnalyzing && <ArrowRight size={18} className="ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Results */}
          <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 sm:p-8">
            {/* Risk score */}
            <div className="text-center mb-8">
              <div className={cn('text-6xl sm:text-7xl font-bold', getRiskColor(result.riskScore))}>
                {result.riskScore}%
              </div>
              <p className={cn('text-sm uppercase tracking-[0.24em] mt-2', getRiskColor(result.riskScore))}>
                {getRiskLabel(result.riskScore)}
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-2">
                {result.wordCount} words analyzed • {result.totalIssues} issues found
              </p>
            </div>

            {/* Preview issues */}
            {result.previewIssues.length > 0 && (
              <div className="space-y-4 mb-6">
                <h4 className="text-sm font-semibold uppercase tracking-[0.2em]">
                  Sample Issues Detected
                </h4>
                {result.previewIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="border-[3px] border-[hsl(var(--border-strong))] rounded-[var(--radius)] p-4 bg-[hsl(var(--surface-muted))]"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={18} />
                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-[0.16em] font-semibold">
                          {issue.type}
                        </p>
                        <p className="text-xs uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))] mt-1">
                          "{issue.text}"
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--secondary))] mt-2">
                          💡 {issue.suggestion}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Locked content indicator */}
            {result.totalIssues > 2 && (
              <div className="border-[3px] border-dashed border-[hsl(var(--border-strong))] rounded-[var(--radius)] p-6 text-center bg-[hsl(var(--surface-muted))] mb-6">
                <p className="text-sm uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  +{result.totalIssues - 2} more issues detected
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-2">
                  Sign up to see all issues and get fix suggestions
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="text-center space-y-4">
              <Link 
                href={`/auth/signup?from=plagiarism&email=${encodeURIComponent(capturedEmail)}`}
                onClick={handleSignupClick}
              >
                <Button className="px-8 py-4">
                  Get Full Report Free
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                No credit card required • Free plan includes 3 full checks per day
              </p>
            </div>
          </div>
        </div>
      )}

      <LeadMagnetEmailCapture
        isOpen={showEmailCapture}
        onClose={() => setShowEmailCapture(false)}
        onSubmit={handleEmailSubmit}
        source="plagiarism"
        isLoading={isAnalyzing}
      />
    </section>
  );
}
