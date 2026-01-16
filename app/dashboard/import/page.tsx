'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Sidebar, { MobileMenuButton } from '@/components/Sidebar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Upload, FileText, CheckCircle2, AlertCircle, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExtractedData {
  title: string;
  sections: Array<{ title: string; content: string; order: number }>;
  citations: any[];
  detectedType: 'essay' | 'thesis' | 'journal' | 'research';
  detectedCitationStyle: string;
  wordCount: number;
  topic: string;
}

export default function ImportProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [continuationMessage, setContinuationMessage] = useState('');

  // Form state for review/editing
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState<'essay' | 'thesis' | 'journal' | 'research'>('research');
  const [topic, setTopic] = useState('');
  const [targetWordCount, setTargetWordCount] = useState(0);
  const [citationStyle, setCitationStyle] = useState('APA');
  const [methodology, setMethodology] = useState('');

  // Check for continuation from lead magnet
  useEffect(() => {
    const isContinuation = searchParams.get('continue') === 'true';
    if (isContinuation) {
      const stored = sessionStorage.getItem('lead_magnet_content');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Handle both import and plagiarism (file upload) continuations
          if ((parsed.type === 'import' && parsed.result) || (parsed.type === 'plagiarism' && parsed.fileName && !parsed.text)) {
            // Pre-fill with stored data
            const fileName = parsed.fileName || 'your document';
            const title = parsed.result?.title || fileName.replace(/\.(docx|pdf|txt)$/i, '') || 'Imported Project';
            setProjectName(title);
            setContinuationMessage(`Welcome back! Please re-upload "${fileName}" to continue where you left off.`);
            // Clear the stored content since we've used it
            sessionStorage.removeItem('lead_magnet_content');
          }
        } catch {
          // Ignore parse errors
        }
      }
    } else {
      // Clear continuation message when not in continuation flow
      setContinuationMessage('');
    }
  }, [searchParams]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setExtractedData(null);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError('');
      setExtractedData(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/projects/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const data = await response.json();
      setExtractedData(data.extracted);
      
      // Pre-fill form with extracted data
      setProjectName(data.extracted.title || file.name.replace(/\.(docx|pdf|txt)$/i, ''));
      setProjectType(data.extracted.detectedType);
      setTopic(data.extracted.topic || '');
      setTargetWordCount(data.extracted.wordCount || 0);
      setCitationStyle(data.extracted.detectedCitationStyle || 'APA');
      setMethodology(data.extracted.detectedMethodology || ''); // Auto-detect from document
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!extractedData) return;

    // Validate required fields
    if (!projectName.trim() || !topic.trim() || !methodology.trim()) {
      setError('Please fill in all required fields (Project Name, Topic, Methodology)');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/projects/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim(),
          type: projectType,
          topic: topic.trim(),
          targetWordCount: targetWordCount || extractedData.wordCount,
          citationStyle: citationStyle,
          methodology: methodology.trim(),
          sections: extractedData.sections,
          citations: extractedData.citations,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const data = await response.json();
      
      // Show success message if citations were detected
      if (data.citationsDetected > 0) {
        // Small delay to show success, then redirect
        setTimeout(() => {
          router.push(`/project/${data.project._id}`);
        }, 500);
      } else {
        router.push(`/project/${data.project._id}`);
      }
    } catch (err) {
      console.error('Create error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Sidebar />
      <MobileMenuButton />
      
      <div className="flex-1 md:ml-64 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 pt-16 md:pt-10 md:p-10 space-y-6 md:space-y-10">
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 border-2 border-[hsl(var(--border-strong))] px-3 py-2 rounded-[var(--radius)] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
            >
              ← Back
            </button>
            <span className="hidden sm:inline">Import existing project</span>
          </div>

          <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 md:p-8 space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-[0.12em]">Import Existing Project</h1>
            <p className="text-xs md:text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Upload your document to import sections, content, and citations into Akọ̀wé.
            </p>
          </div>

          {continuationMessage && (
            <div className="border-[4px] border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 p-4 flex items-center gap-3">
              <CheckCircle2 className="text-[hsl(var(--primary))] flex-shrink-0" size={20} />
              <p className="text-xs uppercase tracking-[0.18em]">{continuationMessage}</p>
              <button 
                onClick={() => setContinuationMessage('')}
                className="ml-auto text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {error && (
            <Card className="p-4 border-red-200 bg-red-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={18} />
                </button>
              </div>
            </Card>
          )}

          {!extractedData ? (
            <div className="space-y-6">
              <Card className="p-6 md:p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Upload className="text-[hsl(var(--primary))]" size={24} />
                    <h2 className="text-xl font-bold uppercase tracking-[0.12em]">Upload Document</h2>
                  </div>
                  
                  <div
                    onDrop={handleFileDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className={cn(
                      'border-4 border-dashed rounded-[var(--radius)] p-12 text-center transition-colors',
                      file
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
                        : 'border-[hsl(var(--border-strong))] hover:border-[hsl(var(--primary))]'
                    )}
                  >
                    {file ? (
                      <div className="space-y-4">
                        <FileText className="mx-auto text-[hsl(var(--primary))]" size={48} />
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.16em]">{file.name}</p>
                          <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-2">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => setFile(null)}
                          className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="mx-auto text-[hsl(var(--muted-foreground))]" size={48} />
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] mb-2">
                            Drag and drop your document here
                          </p>
                          <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                            or click to browse
                          </p>
                        </div>
                        <input
                          type="file"
                          accept=".docx,.pdf,.txt"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="file-upload"
                        />
                        <Button 
                          variant="outline" 
                          className="cursor-pointer"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          Select File
                        </Button>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] mt-4">
                          Supported formats: .docx, .pdf, .txt (Max 50MB)
                        </p>
                      </div>
                    )}
                  </div>

                  {file && (
                    <div className="flex justify-end">
                      <Button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="px-6 py-3"
                      >
                        {isUploading ? 'Processing...' : 'Process Document'}
                        {!isUploading && <ArrowRight size={18} className="ml-2" />}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="p-6 md:p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold uppercase tracking-[0.12em]">Review & Confirm</h2>
                    <button
                      onClick={() => {
                        setExtractedData(null);
                        setFile(null);
                      }}
                      className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    >
                      Start Over
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-2 block">
                          Project Name *
                        </label>
                        <input
                          type="text"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--surface))] text-sm uppercase tracking-[0.16em]"
                        />
                      </div>

                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-2 block">
                          Project Type
                        </label>
                        <select
                          value={projectType}
                          onChange={(e) => setProjectType(e.target.value as any)}
                          className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--surface))] text-sm uppercase tracking-[0.16em]"
                        >
                          <option value="essay">Essay</option>
                          <option value="thesis">Thesis</option>
                          <option value="journal">Journal Article</option>
                          <option value="research">Research Paper</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-2 block">
                          Research Topic *
                        </label>
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--surface))] text-sm uppercase tracking-[0.16em]"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-2 block">
                          Target Word Count
                        </label>
                        <input
                          type="number"
                          value={targetWordCount}
                          onChange={(e) => setTargetWordCount(parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--surface))] text-sm uppercase tracking-[0.16em]"
                        />
                      </div>

                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-2 block">
                          Citation Style
                        </label>
                        <select
                          value={citationStyle}
                          onChange={(e) => setCitationStyle(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--surface))] text-sm uppercase tracking-[0.16em]"
                        >
                          <option value="APA">APA</option>
                          <option value="MLA">MLA</option>
                          <option value="Chicago">Chicago</option>
                          <option value="IEEE">IEEE</option>
                          <option value="Harvard">Harvard</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-2 block">
                          Research Methodology *
                        </label>
                        <select
                          value={methodology}
                          onChange={(e) => setMethodology(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--surface))] text-sm uppercase tracking-[0.16em]"
                        >
                          <option value="">Select methodology...</option>
                          <option value="qualitative">Qualitative Research</option>
                          <option value="quantitative">Quantitative Research</option>
                          <option value="mixed methods">Mixed Methods</option>
                          <option value="literature review">Literature Review</option>
                          <option value="case study">Case Study</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="border-t-2 border-[hsl(var(--border-strong))] pt-6">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] mb-4">
                      Imported Content Preview
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em]">
                        <CheckCircle2 className="text-green-500" size={18} />
                        <span>{extractedData.sections.length} sections found</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em]">
                        <CheckCircle2 className="text-green-500" size={18} />
                        <span>{extractedData.wordCount.toLocaleString()} words imported</span>
                      </div>
                      {extractedData.citations.length > 0 && (
                        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em]">
                          <CheckCircle2 className="text-green-500" size={18} />
                          <span>{extractedData.citations.length} citations found</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setExtractedData(null);
                        setFile(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      disabled={isCreating || !projectName.trim() || !topic.trim() || !methodology.trim()}
                      className="px-6 py-3"
                    >
                      {isCreating ? 'Creating Project...' : 'Import Project'}
                      {!isCreating && <ArrowRight size={18} className="ml-2" />}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
