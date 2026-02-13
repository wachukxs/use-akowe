'use client';

import { Link } from '@/i18n/navigation';
import { Shield, ArrowLeft, CheckCircle, FileText, Sparkles } from 'lucide-react';
import HeroPlagiarismTool from '@/components/HeroPlagiarismTool';

export default function PlagiarismCheckPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="border-b-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[4px_4px_0_rgba(29,41,57,0.12)]">
                <ArrowLeft size={18} />
              </span>
              <span className="text-xl font-bold uppercase tracking-[0.16em]">
                Akọ̀wé
              </span>
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 py-2.5 font-semibold uppercase tracking-[0.18em] text-sm"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] px-4 py-2 text-xs uppercase tracking-[0.2em]">
              <Shield size={14} />
              Free Plagiarism Checker
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.06em] leading-tight">
              Check Your Academic Work for Plagiarism
            </h1>
            
            <p className="text-lg text-[hsl(var(--muted-foreground))]">
              Paste your text or upload a document to instantly detect potential plagiarism issues, 
              citation problems, and AI-generated content patterns.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle size={18} className="text-green-500" />
                <span>Checks citation patterns & missing references</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle size={18} className="text-green-500" />
                <span>Detects AI-generated writing patterns</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle size={18} className="text-green-500" />
                <span>Identifies word repetition issues</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle size={18} className="text-green-500" />
                <span>Supports DOCX, PDF, and TXT files</span>
              </div>
            </div>
          </div>

          {/* Plagiarism Tool */}
          <div>
            <HeroPlagiarismTool variant="control" />
          </div>
        </div>

        {/* Features Section */}
        <div className="border-t-[4px] border-[hsl(var(--border-strong))] pt-12">
          <h2 className="text-2xl font-bold uppercase tracking-[0.1em] mb-8 text-center">
            What We Check For
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 space-y-3">
              <FileText size={24} className="text-[hsl(var(--primary))]" />
              <h3 className="text-lg font-bold uppercase tracking-[0.1em]">Citation Analysis</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Detects uncited claims, missing in-text citations, and reference formatting issues.
              </p>
            </div>
            
            <div className="border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 space-y-3">
              <Sparkles size={24} className="text-[hsl(var(--primary))]" />
              <h3 className="text-lg font-bold uppercase tracking-[0.1em]">AI Detection</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Identifies patterns commonly found in AI-generated text that may flag in academic review.
              </p>
            </div>
            
            <div className="border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 space-y-3">
              <Shield size={24} className="text-[hsl(var(--primary))]" />
              <h3 className="text-lg font-bold uppercase tracking-[0.1em]">Writing Quality</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Flags word repetition, academic clichés, and areas that need stronger original writing.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] p-8 text-center">
          <h2 className="text-2xl font-bold uppercase tracking-[0.1em] mb-4">
            Need Full Plagiarism Reports?
          </h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Sign up for Akọ̀wé to get detailed plagiarism reports, AI writing assistance, 
            automatic citation management, and more.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center border-[3px] border-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary-foreground))] text-[hsl(var(--primary))] px-8 py-3 font-semibold uppercase tracking-[0.18em]"
          >
            Get Started Free
          </Link>
        </div>

        {/* Share Section */}
        <div className="mt-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
          <p className="mb-2">Share this tool with classmates:</p>
          <code className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-strong))] px-4 py-2 rounded text-xs">
            https://useakowe.com/tools/plagiarism-check
          </code>
        </div>
      </main>
    </div>
  );
}
