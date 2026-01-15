'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Shield, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';

interface StoredContent {
  type: 'plagiarism' | 'import';
  text?: string;
  result?: {
    title: string;
    sections: Array<{ title: string; preview: string }>;
    sectionCount: number;
    wordCount: number;
    citationCount: number;
  };
  fileName?: string;
  timestamp: number;
}

export default function LeadMagnetContinuation() {
  const router = useRouter();
  const [storedContent, setStoredContent] = useState<StoredContent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Check for stored lead magnet content
    const stored = sessionStorage.getItem('lead_magnet_content');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Only show if less than 1 hour old
        if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
          setStoredContent(parsed);
          setIsVisible(true);
        } else {
          // Expired, clean up
          sessionStorage.removeItem('lead_magnet_content');
        }
      } catch {
        sessionStorage.removeItem('lead_magnet_content');
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.removeItem('lead_magnet_content');
  };

  const handleContinuePlagiarism = async () => {
    if (!storedContent?.text) return;
    
    setIsCreating(true);
    try {
      // Create a new project with the stored text
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Plagiarism Check Project',
          type: 'essay',
          topic: 'Imported from plagiarism check',
          citationStyle: 'apa',
          methodology: 'Not applicable',
          initialContent: storedContent.text,
        }),
      });

      if (response.ok) {
        const { project } = await response.json();
        sessionStorage.removeItem('lead_magnet_content');
        // Redirect to project with plagiarism check trigger
        router.push(`/project/${project._id}?action=plagiarism`);
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleContinueImport = () => {
    // Redirect to import page - the stored content will be used there
    router.push('/dashboard/import?continue=true');
  };

  if (!isVisible || !storedContent) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[hsl(var(--surface))] border-[4px] border-[hsl(var(--border-strong))] max-w-md w-full p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {storedContent.type === 'plagiarism' ? (
              <Shield className="text-[hsl(var(--primary))]" size={20} />
            ) : (
              <FileText className="text-[hsl(var(--primary))]" size={20} />
            )}
            <h2 className="text-lg font-bold uppercase tracking-[0.12em]">
              Continue Where You Left Off
            </h2>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {storedContent.type === 'plagiarism' && storedContent.text && (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              Your text is ready for a full plagiarism check
            </p>
            <div className="border-[2px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-3 rounded">
              <p className="text-xs tracking-wide line-clamp-3">
                {storedContent.text.substring(0, 200)}...
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-2">
                {storedContent.text.split(/\s+/).length} words
              </p>
            </div>
            <Button
              onClick={handleContinuePlagiarism}
              className="w-full"
              disabled={isCreating}
            >
              {isCreating ? 'Creating Project...' : 'Run Full Plagiarism Check'}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        )}

        {storedContent.type === 'import' && storedContent.result && (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              Re-upload your document to continue where you left off
            </p>
            <div className="border-[2px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-3 rounded space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.14em]">
                {storedContent.result.title || storedContent.fileName}
              </p>
              <div className="flex gap-4 text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-green-500" />
                  {storedContent.result.sectionCount} sections
                </span>
                <span>{storedContent.result.wordCount} words</span>
                <span>{storedContent.result.citationCount} citations</span>
              </div>
            </div>
            <Button
              onClick={handleContinueImport}
              className="w-full"
            >
              Continue Import
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        )}

        <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] text-center">
          Use AI assistance, plagiarism checks, and citation tools on your content
        </p>
      </div>
    </div>
  );
}
