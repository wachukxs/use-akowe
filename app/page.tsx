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
              Real sources. Proper citations. Structured writing. Built for scholars.
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
                  <span className="text-3xl sm:text-4xl font-bold">24+</span>
                  <p className="mt-2 text-[9px] sm:text-[10px] uppercase tracking-[0.24em] sm:tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                  Active researchers
                </p>
              </div>
                <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-4 text-center sm:text-left">
                  <span className="text-3xl sm:text-4xl font-bold text-[hsl(var(--accent-foreground))]">10+ hrs</span>
                  <p className="mt-2 text-[9px] sm:text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--accent-foreground))]">
                  Saved monthly per user
                </p>
              </div>
                <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 text-center sm:text-left">
                  <span className="text-3xl sm:text-4xl font-bold">84.6%</span>
                  <p className="mt-2 text-[9px] sm:text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                  User retention rate
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

        {/* Why Generic AI Tools Fail Academic Work */}
        <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]">
              Why ChatGPT-Style Tools Fail Academic Work
            </h2>
            <p className="text-sm sm:text-base uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] max-w-3xl mx-auto">
              Generic AI tools weren't built for scholarly rigor. Here's why Akowé exists as the alternative.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
              <h3 className="text-lg font-semibold uppercase tracking-[0.16em] mb-4 text-[hsl(var(--destructive))]">
                Generic AI Tools
              </h3>
              <ul className="space-y-3 text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                <li className="flex items-start gap-3">
                  <span className="text-[hsl(var(--destructive))] mt-1">✗</span>
                  <span>Hallucinate citations and sources</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[hsl(var(--destructive))] mt-1">✗</span>
                  <span>No built-in citation formatting</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[hsl(var(--destructive))] mt-1">✗</span>
                  <span>Generic writing style, not academic</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[hsl(var(--destructive))] mt-1">✗</span>
                  <span>No plagiarism detection</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[hsl(var(--destructive))] mt-1">✗</span>
                  <span>Requires multiple separate tools</span>
                </li>
              </ul>
            </div>
            <div className="border-[4px] border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 p-6">
              <h3 className="text-lg font-semibold uppercase tracking-[0.16em] mb-4 text-[hsl(var(--primary))]">
                Akowé
              </h3>
              <ul className="space-y-3 text-sm uppercase tracking-[0.18em] text-[hsl(var(--foreground))]">
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1" size={18} />
                  <span>Real sources from academic databases</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1" size={18} />
                  <span>Automatic citation formatting (APA, MLA, IEEE)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1" size={18} />
                  <span>Academic-first writing structure</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1" size={18} />
                  <span>Built-in plagiarism detection</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-[hsl(var(--primary))] mt-1" size={18} />
                  <span>All-in-one integrated platform</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="product-demo" className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))] grid gap-6 lg:grid-cols-3">
          <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
            <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">AI drafting</span>
            <h2 className="mt-6 text-2xl font-semibold uppercase tracking-[0.16em]">
              Compose rigorous sections with adaptive guidance
            </h2>
            <p className="mt-4 text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Control tone, depth, and citation density while Akọ̀wé keeps structure intact.
            </p>
          </div>
          <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
            <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">Scholarly integrity</span>
            <h2 className="mt-6 text-2xl font-semibold uppercase tracking-[0.16em]">
              Cite as you go with trusted academic sources
            </h2>
            <p className="mt-4 text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Comprehensive academic database integration plus plagiarism insights keep work defensible.
            </p>
          </div>
          <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-6 text-[hsl(var(--accent-foreground))]">
            <span className="text-xs uppercase tracking-[0.32em]">Production ready</span>
            <h2 className="mt-6 text-2xl font-semibold uppercase tracking-[0.16em]">
              Export polished manuscripts in minutes
            </h2>
            <p className="mt-4 text-sm uppercase tracking-[0.24em]">
              Structured sections, tracked citations, and DOCX/PDF outputs with one click.
            </p>
        </div>
      </section>

        <section className="max-w-7xl mx-auto py-20">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 space-y-6">
              <Zap className="w-10 h-10 text-[hsl(var(--secondary))]" />
              <h3 className="text-xl font-semibold uppercase tracking-[0.18em]">
                AI-powered drafting
              </h3>
              <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                Compose, reorganize, and iterate with AI that understands academic tone and structure.
              </p>
            </Card>
            <Card className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-8 space-y-6">
              <BookOpen className="w-10 h-10 text-[hsl(var(--border-strong))]" />
              <h3 className="text-xl font-semibold uppercase tracking-[0.18em]">
                Citation intelligence
              </h3>
              <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--foreground))]">
                Surface credible references, auto-format, and maintain shared bibliographies.
              </p>
            </Card>
            <Card className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 space-y-6">
              <Shield className="w-10 h-10 text-[hsl(var(--primary))]" />
              <h3 className="text-xl font-semibold uppercase tracking-[0.18em]">
                Integrity safeguards
              </h3>
              <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                Built-in plagiarism checks, PDF interrogation, and revision history for confident submission.
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