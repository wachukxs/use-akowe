import { Link } from '@/i18n/navigation';
import { BookOpen, ArrowLeft, CheckCircle, ExternalLink } from 'lucide-react';
import HeroReferenceChecker from '@/components/HeroReferenceChecker';

export default function ReferenceCheckerPage() {
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
        {/* Hero */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] px-4 py-2 text-xs uppercase tracking-[0.2em]">
              <BookOpen size={14} />
              Free Reference Checker
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.06em] leading-tight">
              Check your reference list before you submit
            </h1>

            <p className="text-lg text-[hsl(var(--muted-foreground))]">
              Paste your bibliography and we will verify each entry against Crossref, flag broken DOIs,
              and identify formatting issues — in seconds, no login needed.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle size={18} className="text-green-500" />
                <span>Verifies DOIs against Crossref (100M+ records)</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle size={18} className="text-green-500" />
                <span>Flags unresolvable or hallucinated citations</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle size={18} className="text-green-500" />
                <span>Detects missing years, authors, and source types</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle size={18} className="text-green-500" />
                <span>Works with APA, MLA, Chicago, IEEE, and Harvard</span>
              </div>
            </div>

            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-4">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold">
                Inside Akowe you can fix every issue in one click — auto-reformat, find the real DOI, and insert the corrected reference back into your thesis.
              </p>
            </div>
          </div>

          <div>
            <HeroReferenceChecker />
          </div>
        </div>

        {/* What we check */}
        <div className="border-t-[4px] border-[hsl(var(--border-strong))] pt-12">
          <h2 className="text-2xl font-bold uppercase tracking-[0.1em] mb-8 text-center">
            What We Check For
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 space-y-3">
              <ExternalLink size={24} className="text-[hsl(var(--primary))]" />
              <h3 className="text-lg font-bold uppercase tracking-[0.1em]">DOI Verification</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Each DOI is resolved against Crossref in real time. If it returns a 404, the source may be wrong, retracted, or hallucinated by an AI tool.
              </p>
            </div>

            <div className="border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 space-y-3">
              <BookOpen size={24} className="text-[hsl(var(--primary))]" />
              <h3 className="text-lg font-bold uppercase tracking-[0.1em]">Format Issues</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Missing year, unclear author format, or unidentifiable source type — common errors that examiners spot immediately.
              </p>
            </div>

            <div className="border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 space-y-3">
              <CheckCircle size={24} className="text-[hsl(var(--primary))]" />
              <h3 className="text-lg font-bold uppercase tracking-[0.1em]">Metadata Confirm</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                For verified DOIs we confirm the title, year, and authors match what Crossref holds — so you know the citation is attributed correctly.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] p-8 text-center">
          <h2 className="text-2xl font-bold uppercase tracking-[0.1em] mb-4">
            Fix every reference inside Akowe
          </h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Sign up free and import your reference list. Akowe auto-formats citations in APA, MLA, Chicago, IEEE, or Harvard — and searches OpenAlex and Crossref to fill in missing details.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center border-[3px] border-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary-foreground))] text-[hsl(var(--primary))] px-8 py-3 font-semibold uppercase tracking-[0.18em]"
          >
            Get Started Free
          </Link>
        </div>

        <div className="mt-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
          <p className="mb-2">Share this tool with classmates:</p>
          <code className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-strong))] px-4 py-2 rounded text-xs">
            https://useakowe.com/tools/reference-checker
          </code>
        </div>
      </main>
    </div>
  );
}
