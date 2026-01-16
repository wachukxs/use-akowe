'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Shield, Upload, ArrowRight, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import LeadMagnetEmailCapture from './LeadMagnetEmailCapture';
import { trackLeadMagnet } from '@/lib/gtag';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ExitIntentPopupProps {
  variant: 'control' | 'variant_a' | 'variant_b';
  tool: 'plagiarism' | 'import';
}

export default function ExitIntentPopup({ variant, tool }: ExitIntentPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [capturedEmail, setCapturedEmail] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if already shown this session
    if (sessionStorage.getItem('exit_intent_shown')) {
      setHasShown(true);
      return;
    }

    // Don't add listener if already shown
    if (hasShown) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves toward top of viewport (exit intent)
      if (e.clientY <= 0) {
        setIsVisible(true);
        setHasShown(true);
        sessionStorage.setItem('exit_intent_shown', 'true');
        // Track with base variant for consistency, exit_intent is tracked via metadata
        trackLeadMagnet.view(tool, variant);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShown, variant, tool]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setText('');
      setError('');
      trackLeadMagnet.fileUploaded(tool, selectedFile.name.split('.').pop() || 'unknown');
    }
  };

  const handleAnalyze = async () => {
    if (tool === 'plagiarism' && !text.trim() && !file) {
      setError('Please paste text or upload a file');
      return;
    }
    if (tool === 'import' && !file) {
      setError('Please upload a file');
      return;
    }

    setError('');
    trackLeadMagnet.scanStarted(tool);
    setShowEmailCapture(true);
  };

  const handleEmailSubmit = async (email: string) => {
    setCapturedEmail(email);
    setIsAnalyzing(true);

    try {
      await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: tool,
          variant: variant, // Use base variant, not exit_intent suffix (schema only allows control/variant_a/variant_b)
          metadata: file 
            ? { fileType: file.name.split('.').pop(), fileName: file.name, exitIntent: true }
            : { charCount: text.length, exitIntent: true },
        }),
      });

      trackLeadMagnet.emailCaptured(tool);

      const endpoint = tool === 'plagiarism' ? '/api/tools/plagiarism' : '/api/tools/import';
      let response;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        response = await fetch(endpoint, { method: 'POST', body: formData });
      } else {
        response = await fetch(endpoint, {
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
      trackLeadMagnet.resultViewed(tool, tool === 'plagiarism' ? data.riskScore : data.sectionCount);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setShowEmailCapture(false);
    }
  };

  const handleSignupClick = () => {
    trackLeadMagnet.signupClicked(tool);
    
    // Store result for continuation flow after signup
    if (result) {
      sessionStorage.setItem('lead_magnet_content', JSON.stringify({
        type: tool,
        text: tool === 'plagiarism' ? text : undefined,
        result: tool === 'import' ? result : undefined,
        fileName: file?.name,
        timestamp: Date.now(),
      }));
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-[hsl(var(--foreground))]/70 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-in fade-in zoom-in duration-300">
        <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-[var(--radius)] shadow-[12px_12px_0_rgba(29,41,57,0.2)]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b-[3px] border-[hsl(var(--border-strong))]">
            <div className="flex items-center gap-2">
              {tool === 'plagiarism' ? (
                <Shield size={20} className="text-[hsl(var(--primary))]" />
              ) : (
                <Upload size={20} className="text-[hsl(var(--primary))]" />
              )}
              <span className="text-sm font-bold uppercase tracking-[0.16em]">
                {tool === 'plagiarism' ? 'Wait! Check Your Text First' : 'Wait! Import Your Thesis'}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-[hsl(var(--surface-muted))] rounded-[var(--radius)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!result ? (
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] text-center">
                  {tool === 'plagiarism' 
                    ? 'Get a free plagiarism check before you go'
                    : 'See what we can extract from your document'}
                </p>

                {tool === 'plagiarism' && (
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your text here..."
                    className="w-full h-24 px-3 py-2 border-[3px] border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--background))] text-sm tracking-wide resize-none focus:outline-none focus:border-[hsl(var(--primary))]"
                    disabled={!!file || isAnalyzing}
                  />
                )}

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-[3px] border-dashed border-[hsl(var(--border-strong))] rounded-[var(--radius)] p-4 text-center cursor-pointer transition-colors',
                    'hover:border-[hsl(var(--primary))]',
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
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="text-[hsl(var(--primary))]" size={18} />
                      <span className="text-xs font-semibold uppercase tracking-[0.16em]">{file.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Upload size={18} className="text-[hsl(var(--muted-foreground))]" />
                      <span className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                        {tool === 'plagiarism' ? 'Or upload a file' : 'Upload your document'}
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
                  disabled={isAnalyzing || (tool === 'plagiarism' ? (!text.trim() && !file) : !file)}
                >
                  {isAnalyzing ? 'Analyzing...' : tool === 'plagiarism' ? 'Check Now' : 'Analyze'}
                  {!isAnalyzing && <ArrowRight size={16} className="ml-2" />}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tool === 'plagiarism' ? (
                  <>
                    <div className="text-center">
                      <div className={cn(
                        'text-5xl font-bold',
                        result.riskScore < 15 ? 'text-green-600' : result.riskScore < 35 ? 'text-yellow-600' : 'text-red-600'
                      )}>
                        {result.riskScore}%
                      </div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-1">
                        {result.totalIssues} issues found
                      </p>
                    </div>
                    {result.previewIssues?.[0] && (
                      <div className="border-[2px] border-[hsl(var(--border-strong))] rounded p-3 bg-[hsl(var(--surface-muted))]">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="text-yellow-500 flex-shrink-0" size={16} />
                          <div>
                            <p className="text-xs uppercase tracking-[0.14em] font-semibold">{result.previewIssues[0].type}</p>
                            <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                              {result.previewIssues[0].suggestion}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <h4 className="text-sm font-bold uppercase tracking-[0.12em]">{result.title}</h4>
                      <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-1">
                        {result.wordCount.toLocaleString()} words • {result.sectionCount} sections • {result.citationCount} citations
                      </p>
                    </div>
                    {result.sections?.slice(0, 2).map((section: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 border-[2px] border-[hsl(var(--border-strong))] rounded p-2 bg-[hsl(var(--surface-muted))]">
                        <CheckCircle2 className="text-green-500 flex-shrink-0" size={14} />
                        <span className="text-[10px] uppercase tracking-[0.14em] font-semibold">{section.title}</span>
                      </div>
                    ))}
                  </>
                )}

                <Link 
                  href={`/auth/signup?from=${tool}&email=${encodeURIComponent(capturedEmail)}`}
                  onClick={handleSignupClick}
                >
                  <Button className="w-full py-3">
                    {tool === 'plagiarism' ? 'Get Full Report' : 'Continue in Akọ̀wé'}
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <LeadMagnetEmailCapture
        isOpen={showEmailCapture}
        onClose={() => setShowEmailCapture(false)}
        onSubmit={handleEmailSubmit}
        source={tool}
        isLoading={isAnalyzing}
      />
    </div>
  );
}
