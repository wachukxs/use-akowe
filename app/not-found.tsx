'use client';

import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import HeroPlagiarismTool from '@/components/HeroPlagiarismTool';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="border-b-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-xl font-bold uppercase tracking-[0.16em]">
                Akọ̀wé
              </span>
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 py-2.5 font-semibold uppercase tracking-[0.18em] text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: 404 Message */}
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
                Error 404
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.08em]">
                Page Not Found
              </h1>
            </div>
            
            <p className="text-lg text-[hsl(var(--muted-foreground))]">
              The page you're looking for doesn't exist or has been moved.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] px-5 py-3 font-semibold uppercase tracking-[0.14em] text-sm hover:bg-[hsl(var(--surface-muted))] transition-colors"
              >
                <Home size={18} />
                Go Home
              </Link>
              <Link
                href="/guides"
                className="inline-flex items-center gap-2 border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] px-5 py-3 font-semibold uppercase tracking-[0.14em] text-sm hover:bg-[hsl(var(--surface-muted))] transition-colors"
              >
                <Search size={18} />
                Browse Guides
              </Link>
            </div>

            <div className="pt-6 border-t border-[hsl(var(--border-strong))]">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Popular pages:
              </p>
              <div className="flex flex-wrap gap-3 mt-2 text-sm">
                <Link href="/guides" className="text-[hsl(var(--primary))] hover:underline">Guides</Link>
                <Link href="/faq" className="text-[hsl(var(--primary))] hover:underline">FAQ</Link>
                <Link href="/citation-styles" className="text-[hsl(var(--primary))] hover:underline">Citation Styles</Link>
                <Link href="/templates" className="text-[hsl(var(--primary))] hover:underline">Templates</Link>
              </div>
            </div>
          </div>

          {/* Right: Plagiarism Tool */}
          <div className="space-y-4">
            <div className="text-center lg:text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-2">
                While you're here...
              </p>
              <h2 className="text-xl font-bold uppercase tracking-[0.1em]">
                Check Your Work for Plagiarism
              </h2>
            </div>
            <HeroPlagiarismTool variant="control" />
          </div>
        </div>
      </main>
    </div>
  );
}
