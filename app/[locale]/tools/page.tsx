import { Link } from '@/i18n/navigation';
import { Shield, BookOpen, Search, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Academic Writing Tools | Akọ̀wé',
  description:
    'Free tools for thesis and dissertation writing. Check academic sources, verify references, and find research gaps — no account required.',
};

const tools = [
  {
    href: '/tools/plagiarism-check',
    icon: Shield,
    label: 'Academic Source Check',
    desc: 'Check your writing against 250M+ published academic papers from Crossref, arXiv, and Semantic Scholar. Surface uncited claims and verify DOIs.',
    bullets: [
      'Real academic database matching',
      'DOI verification against Crossref',
      'OpenAlex phrase search',
    ],
    cta: 'Check Your Text Free',
  },
  {
    href: '/tools/reference-checker',
    icon: BookOpen,
    label: 'Reference List Checker',
    desc: 'Paste your reference list in any format. Akọ̀wé verifies each DOI against Crossref and flags broken, unresolvable, or malformed references.',
    bullets: [
      'Crossref DOI verification',
      'Detects missing or broken DOIs',
      'Works with APA, MLA, Chicago, Harvard',
    ],
    cta: 'Check Your References Free',
  },
];

export default function ToolsIndexPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Header */}
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

      <main className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-24">
        {/* Hero */}
        <div className="mb-16 space-y-4">
          <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
            Free Tools
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-[0.1em]">
            Academic writing tools.
            <br />
            No account required.
          </h1>
          <p className="text-base sm:text-lg text-[hsl(var(--muted-foreground))] uppercase tracking-[0.16em] max-w-2xl leading-relaxed">
            Built for students and researchers who want to catch citation issues and verify
            references before submission — without signing up first.
          </p>
        </div>

        {/* Tool cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-20">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.href}
                className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[6px_6px_0_rgba(29,41,57,0.12)] flex flex-col"
              >
                <div className="p-6 flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--accent))]">
                      <Icon size={18} />
                    </span>
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em]">
                      {tool.label}
                    </h2>
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed uppercase tracking-[0.12em]">
                    {tool.desc}
                  </p>
                  <ul className="space-y-1.5">
                    {tool.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-xs uppercase tracking-[0.16em]">
                        <Check size={13} className="shrink-0 text-green-600" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 pt-0">
                  <Link
                    href={tool.href}
                    className="flex items-center justify-between w-full border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
                  >
                    {tool.cta}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full product pitch */}
        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-8 rounded-(--radius)">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 items-center justify-center border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] shrink-0">
              <Search size={18} />
            </span>
            <div className="space-y-3">
              <h3 className="text-lg font-bold uppercase tracking-[0.16em]">
                Want more? Get the full workspace free.
              </h3>
              <p className="text-sm uppercase tracking-[0.14em] leading-relaxed text-[hsl(var(--accent-foreground))]/80">
                The free Akọ̀wé account includes an AI writing assistant, real citation search
                (Crossref + OpenAlex), academic source checks, and RIS/BibTeX reference import —
                all in one editor built for thesis writing.
              </p>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
              >
                Start Free — No Credit Card
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="border-t-4 border-[hsl(var(--border-strong))] py-8 mt-8">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-wrap items-center justify-between gap-4 text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.18em]">
          <span>© {new Date().getFullYear()} Akọ̀wé. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[hsl(var(--foreground))] transition-colors">Privacy</Link>
            <Link href="/pricing" className="hover:text-[hsl(var(--foreground))] transition-colors">Pricing</Link>
            <Link href="/" className="hover:text-[hsl(var(--foreground))] transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
