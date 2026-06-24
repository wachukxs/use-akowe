"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  Star,
  BookOpen,
  Shield,
  Layers,
  Check,
} from "lucide-react";
import Button from "@/components/ui/Button";

const BENEFITS = [
  {
    icon: BookOpen,
    title: "Smarter Research",
    body: "AI surfaces verified sources, closes gaps in your literature review, and helps you outline every chapter.",
  },
  {
    icon: Shield,
    title: "Zero Plagiarism",
    body: "Scan your writing before submission and fix flagged passages before your supervisor ever sees them.",
  },
  {
    icon: Layers,
    title: "Auto Citations",
    body: "Generate perfectly formatted references in APA, MLA, Harvard, Chicago, and more — in seconds.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I finished my literature review in two days. It used to take me two weeks.",
    author: "MSc Student · University of Lagos",
  },
  {
    quote:
      "The plagiarism checker caught three paraphrased paragraphs I didn't notice. Saved me.",
    author: "PhD Candidate · University of Ghana",
  },
];

function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && (window as Window & { gtag?: Function }).gtag) {
    (window as Window & { gtag: Function }).gtag("event", name, {
      ...params,
      timestamp: Date.now(),
    });
  }
}

function MetaAdPageContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && typeof window !== "undefined") {
      localStorage.setItem("referralCode", ref);
    }

    trackEvent("meta_ad_landing_viewed", {
      utm_source: searchParams.get("utm_source") || "meta",
      utm_campaign: searchParams.get("utm_campaign"),
      utm_content: searchParams.get("utm_content"),
    });
  }, [searchParams]);

  const buildSignupUrl = () => {
    const ref = searchParams.get("ref");
    const utmParams = new URLSearchParams();
    if (ref) utmParams.set("ref", ref);
    const query = utmParams.toString();
    return `/auth/signup${query ? `?${query}` : ""}`;
  };

  const handleCTAClick = () => {
    trackEvent("meta_ad_cta_clicked", {
      utm_source: searchParams.get("utm_source") || "meta",
      utm_campaign: searchParams.get("utm_campaign"),
    });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">

      {/* ── Header: brand only, no nav ── */}
      <header className="border-b-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 h-16 flex items-center">
          <Link href="/" className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-[0.4em] text-[hsl(var(--muted-foreground))]">
              Academic Research Platform
            </span>
            <span className="text-xl font-bold uppercase tracking-[0.16em]">
              Akowe
            </span>
          </Link>
        </div>
      </header>

      <main className="px-6 sm:px-8">

        {/* ── Hero ── */}
        <section className="max-w-3xl mx-auto py-16 sm:py-24 text-center space-y-7">
          <div className="inline-flex items-center gap-2 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] px-4 py-1.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className="fill-[hsl(var(--accent-foreground))] text-[hsl(var(--accent-foreground))]"
                />
              ))}
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--accent-foreground))]">
              Trusted by thousands of students
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-[0.04em] leading-tight">
            Use Akowe To Write Smarter and Finish Faster
          </h1>

          <p className="text-base sm:text-lg tracking-[0.04em] text-[hsl(var(--muted-foreground))] leading-relaxed max-w-2xl mx-auto">
            Join thousands of students and graduates doing research the easier
            way — outline your structure, identify key research gaps, check for
            plagiarism, and get access to a wealth of verified sources.
          </p>

          <Link href={buildSignupUrl()} onClick={handleCTAClick}>
            <Button
              size="lg"
              className="px-10 py-4 text-base flex items-center gap-3 mx-auto"
            >
              Start Writing Now
              <ArrowRight size={20} />
            </Button>
          </Link>

          <p className="text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            Free to start — no credit card required
          </p>
        </section>

        {/* ── Benefits ── */}
        <section className="max-w-5xl mx-auto pb-16 sm:pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {BENEFITS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 space-y-3"
              >
                <div className="w-10 h-10 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] flex items-center justify-center">
                  <Icon size={18} className="text-[hsl(var(--primary-foreground))]" />
                </div>
                <h3 className="font-bold uppercase tracking-[0.1em] text-sm">
                  {title}
                </h3>
                <p className="text-sm tracking-[0.04em] text-[hsl(var(--muted-foreground))] leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── What you get ── */}
        <section className="max-w-5xl mx-auto pb-16 sm:pb-20">
          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 sm:p-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                  Everything you need
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.06em] leading-tight">
                  One platform. Every research task.
                </h2>
                <p className="text-sm tracking-[0.04em] text-[hsl(var(--muted-foreground))] leading-relaxed">
                  Stop switching between tools. Akowe handles the parts of your
                  thesis that used to slow you down.
                </p>
              </div>
              <ul className="space-y-3">
                {[
                  "AI-powered literature review assistant",
                  "Research gap identification",
                  "Plagiarism checker with fix suggestions",
                  "Citation & reference generator",
                  "Thesis structure templates",
                  "Methodology chapter guidance",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] flex items-center justify-center flex-shrink-0">
                      <Check size={11} className="text-[hsl(var(--accent-foreground))]" />
                    </div>
                    <span className="text-sm tracking-[0.04em]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Social Proof ── */}
        <section className="max-w-5xl mx-auto pb-16 sm:pb-20">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))] text-center mb-6">
            What students are saying
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TESTIMONIALS.map(({ quote, author }) => (
              <div
                key={author}
                className="border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-5 space-y-3"
              >
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      className="fill-[hsl(var(--accent))] text-[hsl(var(--accent))]"
                    />
                  ))}
                </div>
                <p className="text-sm tracking-[0.04em] leading-relaxed italic">
                  &ldquo;{quote}&rdquo;
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  {author}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="max-w-5xl mx-auto pb-20 sm:pb-28">
          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] p-10 sm:p-14 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-[0.06em] text-[hsl(var(--primary-foreground))] leading-tight">
              Ready to finish your thesis faster?
            </h2>
            <p className="text-sm sm:text-base tracking-[0.04em] text-[hsl(var(--primary-foreground))] opacity-85 max-w-lg mx-auto leading-relaxed">
              Join thousands of students who stopped struggling and started
              writing.
            </p>
            <Link href={buildSignupUrl()} onClick={handleCTAClick}>
              <Button
                variant="secondary"
                size="lg"
                className="px-10 py-4 text-base flex items-center gap-3 mx-auto"
              >
                Start Writing Now
                <ArrowRight size={20} />
              </Button>
            </Link>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--primary-foreground))] opacity-70">
              Free to start — no credit card required
            </p>
          </div>
        </section>

      </main>

      {/* ── Minimal footer ── */}
      <footer className="border-t-2 border-[hsl(var(--border))]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            © 2025 Akowe
          </span>
          <div className="flex gap-6 text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            <Link href="/privacy" className="hover:text-[hsl(var(--foreground))] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[hsl(var(--foreground))] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function MetaAdPage() {
  return (
    <Suspense>
      <MetaAdPageContent />
    </Suspense>
  );
}
