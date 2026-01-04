'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, BookOpen, Shield, Download, Check, ArrowRight, Star } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const { status } = useSession();
  const [isAnnual, setIsAnnual] = useState(true); // Default to annual billing

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="sticky top-0 z-50 border-b-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-0 sm:h-20">
            <Link href="/" className="flex flex-col gap-0.5">
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.28em] sm:tracking-[0.4em] text-[hsl(var(--muted-foreground))]">
                Akọ̀wé
              </span>
              <span className="text-xl sm:text-2xl font-bold uppercase tracking-[0.12em] sm:tracking-[0.16em]">
                Research Studio
              </span>
            </Link>
            <nav className="flex flex-wrap items-center gap-3 sm:gap-6 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] sm:tracking-[0.28em]">
              <Link href="/about" className="hover:text-[hsl(var(--secondary))] transition-colors">
                About
              </Link>
              <Link href="/blog" className="hover:text-[hsl(var(--secondary))] transition-colors">
                Blog
              </Link>
              <Link href="/auth/signin" className="hover:text-[hsl(var(--secondary))] transition-colors">
                Sign In
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 sm:px-6 py-2.5 sm:py-3 font-semibold uppercase tracking-[0.18em] transition-transform duration-150 hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="px-6 sm:px-8 lg:px-12">
          <section className="max-w-7xl mx-auto py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-6 space-y-6 sm:space-y-7">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-[0.04em] sm:tracking-[0.1em] leading-tight">
              Academic writing is hard. Your tools shouldn't make it harder.
          </h1>
              <p className="text-lg sm:text-xl md:text-2xl uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[hsl(var(--foreground))] font-medium">
              Write papers, theses, and research documents with real sources and proper citations—all in one workspace.
          </p>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Link href="/auth/signin">
                    <Button className="px-6 sm:px-8 py-3 sm:py-4 flex items-center gap-3 w-full sm:w-auto justify-center">
                      Start writing properly
                      <ArrowRight size={18} />
                    </Button>
                  </Link>
                  {/* <Button
                    variant="outline"
                    className="px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto justify-center"
                    onClick={() => document.getElementById('product-demo')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Watch Demo
                  </Button> */}
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] text-center sm:text-left">
                  Free to start · Built for academic integrity · Upgrade when ready
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] text-center sm:text-left space-y-1">
                  <span className="block">No credit card required</span>
                  <span className="block">You own your work</span>
                </p>
              </div>
              {/* Trust Signals */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 sm:pt-6">
                <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 text-center sm:text-left">
                  <span className="text-3xl sm:text-4xl font-bold">Setup</span>
                  <p className="mt-2 text-[9px] sm:text-[10px] uppercase tracking-[0.24em] sm:tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                  In 2 minutes
                </p>
              </div>
                <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 text-center sm:text-left">
                  <span className="text-3xl sm:text-4xl font-bold">Citations</span>
                  <p className="mt-2 text-[9px] sm:text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                  In seconds
                </p>
              </div>
                <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-4 text-center sm:text-left">
                  <span className="text-3xl sm:text-4xl font-bold text-[hsl(var(--accent-foreground))]">10+ hrs</span>
                  <p className="mt-2 text-[9px] sm:text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--accent-foreground))]">
                  Saved monthly
                </p>
              </div>
            </div>
            
            {/* Early Testimonial */}
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <Star className="text-[hsl(var(--accent))] flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-sm uppercase tracking-[0.16em] text-[hsl(var(--foreground))] italic">
                    "Finally, a tool that understands academic writing."
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-2">
                    — Graduate Student
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 space-y-4">
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))] mb-4">
                <span>Project overview</span>
                <span>Thesis</span>
              </div>
              <Image
                src="/product-demo.png"
                alt="Akọ̀wé interface"
                width={800}
                height={480}
                className="w-full border-2 border-[hsl(var(--border-strong))]"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <h3 className="text-sm uppercase tracking-[0.28em] mb-4">AI co-author</h3>
                <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  Outline, draft, and refine without leaving the structured editor.
                </p>
              </Card>
              <Card className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-6">
                <h3 className="text-sm uppercase tracking-[0.28em] mb-4">Integrity tools</h3>
                <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--foreground))]">
                  Citations, originality checks, and PDF insights in one view.
                </p>
              </Card>
          </div>
        </div>
      </section>

        {/* Why Akowe vs Competitors */}
        <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]">
              Why researchers choose Akowe over other tools
            </h2>
            <p className="text-sm sm:text-base uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] max-w-3xl mx-auto">
              Other tools do one thing well. Akowe does everything you need in one workspace.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 mb-12">
            {/* Left: Other Tools Limitations */}
            <div className="space-y-6">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <h3 className="text-lg font-semibold uppercase tracking-[0.16em] mb-4 text-[hsl(var(--muted-foreground))]">
                  Writing Tools (Jenni.ai, ChatGPT)
                </h3>
                <ul className="space-y-3 text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  <li className="flex items-start gap-3">
                    <span className="text-[hsl(var(--destructive))] mt-1">✗</span>
                    <span>No integrated citation management</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[hsl(var(--destructive))] mt-1">✗</span>
                    <span>Separate plagiarism checker required</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[hsl(var(--destructive))] mt-1">✗</span>
                    <span>Manual citation formatting</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[hsl(var(--destructive))] mt-1">✗</span>
                    <span>Juggle multiple tabs and tools</span>
                  </li>
                </ul>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <h3 className="text-lg font-semibold uppercase tracking-[0.16em] mb-4 text-[hsl(var(--muted-foreground))]">
                  Reference Managers (Mendeley, Zotero)
                </h3>
                <ul className="space-y-3 text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  <li className="flex items-start gap-3">
                    <span className="text-[hsl(var(--destructive))] mt-1">✗</span>
                    <span>No AI writing assistance</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[hsl(var(--destructive))] mt-1">✗</span>
                    <span>No built-in plagiarism detection</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[hsl(var(--destructive))] mt-1">✗</span>
                    <span>Requires browser extensions and plugins</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[hsl(var(--destructive))] mt-1">✗</span>
                    <span>Separate writing environment needed</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right: Akowe Advantages */}
            <div className="border-[4px] border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 p-6">
              <h3 className="text-lg font-semibold uppercase tracking-[0.16em] mb-6 text-[hsl(var(--primary))]">
                Akowe: All-in-One Workspace
              </h3>
              <ul className="space-y-4 text-sm uppercase tracking-[0.18em] text-[hsl(var(--foreground))]">
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1 flex-shrink-0" size={18} />
                  <div>
                    <span className="font-semibold">AI writing + Citations + Plagiarism checks</span>
                    <span className="block text-[hsl(var(--muted-foreground))] mt-1 text-xs normal-case">Everything in one integrated workspace</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1 flex-shrink-0" size={18} />
                  <div>
                    <span className="font-semibold">Real sources from academic databases</span>
                    <span className="block text-[hsl(var(--muted-foreground))] mt-1 text-xs normal-case">OpenAlex, Crossref integration—no hallucinations</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1 flex-shrink-0" size={18} />
                  <div>
                    <span className="font-semibold">Auto-format citations in multiple styles</span>
                    <span className="block text-[hsl(var(--muted-foreground))] mt-1 text-xs normal-case">APA, MLA, IEEE, Chicago—no manual formatting</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1 flex-shrink-0" size={18} />
                  <div>
                    <span className="font-semibold">Built-in plagiarism detection</span>
                    <span className="block text-[hsl(var(--muted-foreground))] mt-1 text-xs normal-case">Check against academic databases before submission</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1 flex-shrink-0" size={18} />
                  <div>
                    <span className="font-semibold">Academic-first design</span>
                    <span className="block text-[hsl(var(--muted-foreground))] mt-1 text-xs normal-case">Section-based editor built for papers and theses</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1 flex-shrink-0" size={18} />
                  <div>
                    <span className="font-semibold">No browser extensions or plugins</span>
                    <span className="block text-[hsl(var(--muted-foreground))] mt-1 text-xs normal-case">Everything works natively in one platform</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Key Differentiator Callout */}
          <div className="border-[4px] border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 p-6 text-center">
            <p className="text-base uppercase tracking-[0.16em] text-[hsl(var(--foreground))] font-semibold mb-2">
              Save 10+ hours monthly by eliminating tool-switching
            </p>
            <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
              No more copying citations, switching tabs, or formatting manually
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto py-20 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em]">
              Everything you need to write better research
            </h2>
            <p className="text-sm sm:text-base uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] max-w-3xl mx-auto">
              All-in-one workspace. No juggling multiple tools.
            </p>
          </div>

          {/* Feature 1: AI Writing Assistant */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">AI Writing</span>
                <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.12em]">
                  Overcome writer's block with AI that understands academic writing
                </h3>
              </div>
              <p className="text-base uppercase tracking-[0.16em] text-[hsl(var(--foreground))]">
                Get contextual suggestions while you write. Maintain scholarly tone. Structure sections automatically. All within your document.
              </p>
              <ul className="space-y-3 text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1 flex-shrink-0" size={18} />
                  <span>Context-aware sentence suggestions as you write</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1 flex-shrink-0" size={18} />
                  <span>Academic tone maintained automatically</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1 flex-shrink-0" size={18} />
                  <span>Section-based structure for papers and theses</span>
                </li>
              </ul>
            </div>
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
              <Image
                src="/feature-ai-assistant.png"
                alt="Akowe AI Writing Assistant interface"
                width={800}
                height={600}
                className="w-full border-2 border-[hsl(var(--border-strong))] rounded"
              />
            </div>
          </div>

          {/* Feature 2: Citation Management */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1 border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
              <Image
                src="/feature-citations.png"
                alt="Akowe citation search and management interface"
                width={800}
                height={600}
                className="w-full border-2 border-[hsl(var(--border-strong))] rounded"
              />
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">Citations</span>
                <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.12em]">
                  Find real academic sources in seconds, not hours
                </h3>
              </div>
              <p className="text-base uppercase tracking-[0.16em] text-[hsl(var(--foreground))]">
                Search academic databases. Find credible papers instantly. Auto-format citations in APA, MLA, IEEE, and more. No more manual bibliography work.
              </p>
              <ul className="space-y-3 text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1 flex-shrink-0" size={18} />
                  <span>Search OpenAlex and Crossref databases</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1 flex-shrink-0" size={18} />
                  <span>Auto-format in APA, MLA, IEEE, Chicago styles</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1 flex-shrink-0" size={18} />
                  <span>One-click add to your document</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3: Plagiarism Detection */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">Integrity</span>
                <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.12em]">
                  Check originality before submission. No surprises.
                </h3>
              </div>
              <p className="text-base uppercase tracking-[0.16em] text-[hsl(var(--foreground))]">
                Built-in plagiarism detection checks against academic databases. Get similarity scores and repetition analysis. Fix issues before you submit.
              </p>
              <ul className="space-y-3 text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1 flex-shrink-0" size={18} />
                  <span>Check against Crossref, arXiv, and Scholar databases</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1 flex-shrink-0" size={18} />
                  <span>Repetition analysis to improve writing quality</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1 flex-shrink-0" size={18} />
                  <span>Detailed similarity reports with source links</span>
                </li>
              </ul>
            </div>
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
              <Image
                src="/feature-plagiarism-check.png"
                alt="Akowe plagiarism check results interface"
                width={800}
                height={600}
                className="w-full border-2 border-[hsl(var(--border-strong))] rounded"
              />
            </div>
          </div>

          {/* Quick Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
              <Zap className="w-8 h-8 text-[hsl(var(--primary))] mb-4" />
              <h4 className="text-lg font-semibold uppercase tracking-[0.16em] mb-3">
                All-in-one workspace
              </h4>
              <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                Writing, citations, and plagiarism checks in one place. No switching between tools.
              </p>
            </Card>
            <Card className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-6">
              <BookOpen className="w-8 h-8 text-[hsl(var(--primary))] mb-4" />
              <h4 className="text-lg font-semibold uppercase tracking-[0.16em] mb-3">
                Export ready
              </h4>
              <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--foreground))]">
                Export to PDF or DOCX with properly formatted citations. Ready for submission.
              </p>
            </Card>
            <Card className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
              <Shield className="w-8 h-8 text-[hsl(var(--primary))] mb-4" />
              <h4 className="text-lg font-semibold uppercase tracking-[0.16em] mb-3">
                Academic integrity
              </h4>
              <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                Built for scholars. Real sources only. Proper citations. No shortcuts.
              </p>
            </Card>
          </div>
        </section>

      </main>
      <section className="px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto py-20 border-t-[4px] border-[hsl(var(--border-strong))] space-y-12">
          <div className="text-center space-y-4">
            <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
              Plans
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em]">
              Simple, transparent pricing
            </h2>
            <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
              Start free, upgrade when your research demands more power.
            </p>
          </div>
          
          <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 md:p-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl space-y-2">
              <span className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                What are AI words?
            </span>
              <p className="text-sm uppercase tracking-[0.2em] text-[hsl(var(--foreground))]">
                AI words include assistant responses, AI-written content, and outlines. Your own writing never counts toward the limit.
              </p>
            </div>
            <div className="flex items-center gap-3">
            <button
                onClick={() => setIsAnnual(false)}
                className={cn(
                  'px-4 py-2 border-2 border-[hsl(var(--border-strong))] text-xs font-semibold uppercase tracking-[0.24em] transition-transform duration-150',
                  !isAnnual
                    ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] -translate-x-[0.125rem] -translate-y-[0.125rem]'
                    : 'bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]'
                )}
              >
                Monthly
            </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={cn(
                  'px-4 py-2 border-2 border-[hsl(var(--border-strong))] text-xs font-semibold uppercase tracking-[0.24em] transition-transform duration-150',
                  isAnnual
                    ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] -translate-x-[0.125rem] -translate-y-[0.125rem]'
                    : 'bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]'
                )}
              >
              Annual
              </button>
            {isAnnual && (
                <span className="px-3 py-2 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[10px] font-semibold uppercase tracking-[0.28em] text-[hsl(var(--accent-foreground))]">
                Save 47%
              </span>
            )}
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 flex flex-col gap-6">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">Free plan</span>
                <span className="text-5xl font-bold">$0</span>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                  Perfect for getting started.
                </p>
              </div>
              <ul className="space-y-3 text-xs uppercase tracking-[0.24em] text-[hsl(var(--foreground))]">
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  1,500 AI words per day
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  3 plagiarism checks per day
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  3 projects maximum
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  Smart citation search
                </li>
              </ul>
              <Link href="/auth/signin">
                <Button variant="outline" className="w-full py-4">
                  Get Started
                </Button>
              </Link>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] text-center">
                No credit card required
              </p>
            </div>
            
            <div className="relative border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-8 flex flex-col gap-6">
              <span className="absolute -top-4 left-4 px-3 py-1 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-[10px] font-semibold uppercase tracking-[0.3em] text-[hsl(var(--foreground))]">
                Popular
                </span>
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.32em]">Pro plan</span>
                <span className="text-5xl font-bold">{isAnnual ? '$10' : '$19'}</span>
                <p className="text-[10px] uppercase tracking-[0.28em]">
                  {isAnnual ? 'Per month, billed annually.' : 'Per month on flexible billing.'}
                </p>
              </div>
              <ul className="space-y-3 text-xs uppercase tracking-[0.24em]">
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  Unlimited AI words
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  Unlimited plagiarism checks
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  Unlimited projects
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  Advanced citation search
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  Advanced AI model access
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  Priority support
                </li>
              </ul>
              <Link href="/auth/signin">
                <Button className="w-full py-4">
                  Upgrade to Pro
                </Button>
              </Link>
              <p className="text-[10px] uppercase tracking-[0.24em] text-center">
                Built for academic integrity · You own your work
              </p>
            </div>
            
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 flex flex-col gap-6 opacity-80">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">Team plan</span>
                <span className="text-4xl font-bold">Coming Soon</span>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                  Collaboration and governance tools for research teams.
                </p>
              </div>
              <ul className="space-y-3 text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  Everything in Pro
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  Shared workspaces
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  Admin controls
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  Central bibliography pool
                </li>
              </ul>
              <Button variant="ghost" className="w-full py-4" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-20 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                Academic alignment
              </span>
              <h3 className="text-3xl font-semibold uppercase tracking-[0.16em]">
                Built for rigor, clarity, and academic integrity.
              </h3>
              <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                Replace fragmented tooling with a single studio that respects scholarly standards. Trusted by students and researchers across universities.
            </p>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-4 mt-6">
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--foreground))]">
                  <strong>Academic-First Design:</strong> Every feature built specifically for scholarly work, not retrofitted from generic tools.
                </p>
              </div>
          </div>
            <div className="lg:col-span-7 grid gap-4">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <h4 className="text-sm font-semibold uppercase tracking-[0.24em] mb-3">
                  All-in-one workflow
                </h4>
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  Drafting, citations, plagiarism checks, and exports live together so work stays organized.
                </p>
                    </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-6">
                <h4 className="text-sm font-semibold uppercase tracking-[0.24em] mb-3">
                  Designed for academics
                </h4>
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--foreground))]">
                  Structured sections, methodology prompts, and citation intelligence keep research on track.
                </p>
                    </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <h4 className="text-sm font-semibold uppercase tracking-[0.24em] mb-3">
                  Predictable pricing
                </h4>
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  Our Pro plan averages 50% less than stitching together single-purpose tools.
                </p>
                    </div>
                    </div>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center space-y-2">
              <span className="text-4xl font-extrabold uppercase tracking-[0.1em]">50%+</span>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                Savings versus separate writing, citation, and plagiarism tools.
              </p>
            </div>
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-6 text-center space-y-2 text-[hsl(var(--accent-foreground))]">
              <span className="text-4xl font-extrabold uppercase tracking-[0.1em]">All-in-one</span>
              <p className="text-[10px] uppercase tracking-[0.28em]">
                AI drafting, citations, PDF analysis, and export in a single workspace.
              </p>
            </div>
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center space-y-2">
              <span className="text-4xl font-extrabold uppercase tracking-[0.1em]">10 hrs</span>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                Average time saved every month for scholars using Akọ̀wé.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-xl font-semibold uppercase tracking-[0.16em]">Akọ̀wé</h4>
            <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
              Built for scholars, by scholars.
            </p>
          </div>
          <nav className="flex gap-6 text-xs uppercase tracking-[0.28em]">
            <Link href="/about" className="hover:text-[hsl(var(--secondary))] transition-colors">
              Learn our story
            </Link>
            <Link href="/blog" className="hover:text-[hsl(var(--secondary))] transition-colors">
              Blog
            </Link>
            <Link href="/auth/signin" className="hover:text-[hsl(var(--secondary))] transition-colors">
              Sign in
            </Link>
          </nav>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
            © 2025 Akọ̀wé. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}