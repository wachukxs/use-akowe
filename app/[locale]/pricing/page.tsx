'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const FREE_FEATURES = [
  '500 AI words per day',
  '1 active project',
  '1 plagiarism check per week (OpenAlex + Crossref)',
  'Real citation search (OpenAlex & Crossref)',
  'APA, MLA, Chicago, IEEE, Harvard formatting',
  'Topic finder (1 search/day)',
  'PDF & DOCX export',
  'Peer review sharing (1 link)',
];

const STANDARD_FEATURES = [
  '2,000 AI words per day',
  'Up to 10 projects',
  '5 plagiarism checks per day',
  'Everything in Free',
  'Literature review AI analysis',
  '10 AI paraphrases per day',
  'Priority export queue',
  'Multiple peer review links',
];

const PRO_FEATURES = [
  'Unlimited AI words',
  'Unlimited projects',
  'Unlimited plagiarism checks',
  'Everything in Standard',
  'Unlimited AI paraphrases',
  'Unlimited literature review analyses',
  'Advanced source matching',
  'Priority support',
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="border-b-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[4px_4px_0_rgba(29,41,57,0.12)]">
                <ArrowLeft size={18} />
              </span>
              <span className="text-xl font-bold uppercase tracking-[0.16em]">Akọ̀wé</span>
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 py-2.5 font-semibold uppercase tracking-[0.18em] text-sm"
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 space-y-16">
        {/* Heading */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.08em]">
            Simple, honest pricing
          </h1>
          <p className="text-base uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            Start free. Upgrade when you need more. No hidden fees, no tricks.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 pt-2">
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
              <span className="px-3 py-1.5 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-[10px] font-semibold uppercase tracking-[0.24em]">
                Save up to 17%
              </span>
            )}
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-4">
          {/* Free */}
          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 flex flex-col gap-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">Free</span>
              <div className="text-5xl font-bold">$0</div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">No credit card required</p>
            </div>
            <ul className="space-y-3 text-xs uppercase tracking-[0.2em] flex-1">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-3">
                  <Check size={14} className="mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] px-4 py-3 font-semibold uppercase tracking-[0.18em] text-xs hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform"
            >
              Get started free
            </Link>
          </div>

          {/* Standard — recommended */}
          <div className="relative border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-6 pt-8 flex flex-col gap-6">
            <span className="absolute -top-4 left-4 px-3 py-1 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-[10px] font-semibold uppercase tracking-[0.3em] text-[hsl(var(--foreground))]">
              Most popular
            </span>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.32em]">Standard</span>
              <div className="text-5xl font-bold">
                {isAnnual ? '$70' : '$7'}
              </div>
              <p className="text-[10px] uppercase tracking-[0.24em]">
                {isAnnual ? 'per year · billed annually' : 'per month · cancel anytime'}
              </p>
              {isAnnual && (
                <p className="text-[10px] uppercase tracking-[0.2em] font-semibold">
                  ≈$5.83/mo equivalent
                </p>
              )}
            </div>
            <ul className="space-y-3 text-xs uppercase tracking-[0.2em] flex-1">
              {STANDARD_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-3">
                  <Check size={14} className="mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--foreground))] text-[hsl(var(--background))] px-4 py-3 font-semibold uppercase tracking-[0.18em] text-xs hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform"
            >
              Start Standard
              <ArrowRight size={14} className="ml-2" />
            </Link>
          </div>

          {/* Pro */}
          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 flex flex-col gap-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">Pro</span>
              <div className="text-5xl font-bold">
                {isAnnual ? '$120' : '$12'}
              </div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                {isAnnual ? 'per year · billed annually' : 'per month · cancel anytime'}
              </p>
              {isAnnual && (
                <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[hsl(var(--foreground))]">
                  ≈$10/mo equivalent
                </p>
              )}
            </div>
            <ul className="space-y-3 text-xs uppercase tracking-[0.2em] flex-1">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-3">
                  <Check size={14} className="mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-3 font-semibold uppercase tracking-[0.18em] text-xs hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform"
            >
              Start Pro
              <ArrowRight size={14} className="ml-2" />
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="border-t-4 border-[hsl(var(--border-strong))] pt-12 space-y-8">
          <h2 className="text-2xl font-bold uppercase tracking-[0.1em] text-center">Common questions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                q: 'Do I need a credit card to start?',
                a: 'No. The free plan requires no payment information. Add a card only when you choose to upgrade.',
              },
              {
                q: 'What counts as an AI word?',
                a: 'Each word generated by the AI writing assistant counts toward your daily limit. Reading, editing, and citations do not count.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Monthly plans cancel at end of the billing period. Annual plans are non-refundable after 7 days.',
              },
              {
                q: 'Does Akowe use my work to train AI?',
                a: 'No. Your projects and content are never used to train any AI model. You own your work.',
              },
              {
                q: 'What does plagiarism checking actually do?',
                a: 'The free tool searches OpenAlex (250M+ academic papers) for matching content and verifies your DOIs against Crossref. Paid plans run more queries for deeper coverage.',
              },
              {
                q: 'Is there a student discount?',
                a: 'The free plan is designed for students with lower word count needs. Contact us at hello@useakowe.com if your institution wants bulk access.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-5 space-y-2">
                <p className="text-sm font-bold uppercase tracking-[0.14em]">{q}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] p-8 text-center">
          <h2 className="text-2xl font-bold uppercase tracking-[0.1em] mb-4">Start writing for free today</h2>
          <p className="mb-6 max-w-xl mx-auto">
            No credit card. No time limit on the free plan. Upgrade when you are ready.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center border-[3px] border-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary-foreground))] text-[hsl(var(--primary))] px-8 py-3 font-semibold uppercase tracking-[0.18em]"
          >
            Get Started Free
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      </main>
    </div>
  );
}
