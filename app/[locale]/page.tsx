"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Check, ArrowRight, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import HeroPlagiarismTool from "@/components/HeroPlagiarismTool";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import HeroTopicFinder from "@/components/HeroTopicFinder";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import {
  getProPlanDiscount,
  formatDiscountPercentage,
} from "@/lib/annual-discount";
import {
  getLandingPageVariant,
  type LandingPageVariant,
} from "@/lib/channel-landing-pages";

// Helper function to get A/B test variant from cookie
function getABVariant(): "control" | "variant_a" | "variant_b" {
  if (typeof window === "undefined") return "control";

  const cookies = document.cookie.split(";");
  const variantCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("akowe_ab_variant=")
  );

  if (variantCookie) {
    const value = variantCookie.split("=")[1]?.trim();
    if (value === "variant_a" || value === "variant_b") {
      return value;
    }
  }

  return "control";
}

function HomePageContent() {
  const searchParams = useSearchParams();
  useSession();
  const tCommon = useTranslations("common");
  const tHome = useTranslations("home");
  const [isAnnual, setIsAnnual] = useState(false); // Default to monthly billing
  const [abVariant, setAbVariant] = useState<
    "control" | "variant_a" | "variant_b"
  >("control");
  const [channelVariant, setChannelVariant] =
    useState<LandingPageVariant>("default");

  /**
   * we don't need this, but Ola wants this here.
   */
  // useEffect(() => {
  //   if (status === 'authenticated') {
  //     router.push('/dashboard');
  //   }
  // }, [status, router]);

  // Read A/B test variant and channel-specific variant on mount
  useEffect(() => {
    const variant = getABVariant();
    setAbVariant(variant);

    // Determine channel-specific landing page variant
    const utmSource = searchParams.get("utm_source");
    const utmMedium = searchParams.get("utm_medium");
    const utmCampaign = searchParams.get("utm_campaign");
    const utmContent = searchParams.get("utm_content");

    const channelVariantValue = getLandingPageVariant(
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent
    );
    setChannelVariant(channelVariantValue);

    // Track A/B test view in GA4
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "ab_test_viewed", {
        experiment_name: "landing_page_headline_v1",
        variant: variant,
        timestamp: Date.now(),
      });

      // Track channel-specific landing page view
      (window as any).gtag("event", "channel_landing_page_viewed", {
        channel_variant: channelVariantValue,
        utm_source: utmSource || "direct",
        utm_medium: utmMedium || "direct",
        utm_campaign: utmCampaign || null,
        utm_content: utmContent || null,
        timestamp: Date.now(),
      });
    }
  }, [searchParams]);

  // Track conversion events
  const trackConversion = (conversionType: string) => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "ab_test_converted", {
        experiment_name: "landing_page_headline_v1",
        variant: abVariant,
        conversion_type: conversionType,
        channel_variant: channelVariant,
        timestamp: Date.now(),
      });
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="sticky top-0 z-50 border-b-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-0 sm:h-20">
            <Link href="/" className="flex flex-col gap-0.5">
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.28em] sm:tracking-[0.4em] text-[hsl(var(--muted-foreground))]">
                {tCommon("brandSubtitle")}
              </span>
              <span className="text-xl sm:text-2xl font-bold uppercase tracking-[0.12em] sm:tracking-[0.16em]">
                {tCommon("brandTitle")}
              </span>
            </Link>
            <nav className="flex flex-wrap items-center gap-3 sm:gap-6 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] sm:tracking-[0.28em]">
              <Link
                href="/blog"
                className="hover:text-[hsl(var(--secondary))] transition-colors"
              >
                {tCommon("blog")}
              </Link>
              <Link
                href="/auth/signin"
                className="hover:text-[hsl(var(--secondary))] transition-colors"
              >
                {tCommon("signIn")}
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 sm:px-6 py-2.5 sm:py-3 font-semibold uppercase tracking-[0.18em] transition-transform duration-150 hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]"
              >
                {tCommon("getStarted")}
              </Link>
              <LocaleSwitcher />
            </nav>
          </div>
        </div>
      </header>

      <main className="px-6 sm:px-8 lg:px-12">
        <section className="max-w-7xl mx-auto py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Copy Section - Order: 2 on mobile, 1 on desktop */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-7 order-2 lg:order-1">
            {/* A/B Test: Hero Section */}
            {abVariant === "control" ? (
              <>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-[0.04em] sm:tracking-[0.1em] leading-tight">
                  {tHome("heroControl.title")}
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[hsl(var(--foreground))] font-medium">
                  {tHome("heroControl.subtitle")}
                </p>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Link
                      href="/auth/signin"
                      onClick={() => trackConversion("signup_click")}
                    >
                      <Button className="px-6 sm:px-8 py-3 sm:py-4 flex items-center gap-3 w-full sm:w-auto justify-center">
                        {tCommon("startFree")}
                        <ArrowRight size={18} />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto justify-center"
                      onClick={() =>
                        document
                          .getElementById("features")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                    >
                      {tCommon("seeHowItWorks")}
                    </Button>
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] text-center sm:text-left">
                    {tCommon("builtForIntegrity")}
                  </p>
                </div>
              </>
            ) : abVariant === "variant_a" ? (
              <>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-[0.04em] sm:tracking-[0.1em] leading-tight">
                  {tHome("heroVariantA.title")}
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[hsl(var(--foreground))] font-medium">
                  {tHome("heroVariantA.subtitle")}
                </p>
                <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  {tHome("heroVariantA.tagline")}
                </p>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Link
                      href="/auth/signin"
                      onClick={() => trackConversion("signup_click")}
                    >
                      <Button className="px-6 sm:px-8 py-3 sm:py-4 flex items-center gap-3 w-full sm:w-auto justify-center">
                        {tCommon("startWritingNow")}
                        <ArrowRight size={18} />
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-[0.04em] sm:tracking-[0.1em] leading-tight">
                  {tHome("heroVariantB.title")}
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[hsl(var(--foreground))] font-medium">
                  {tHome("heroVariantB.subtitle")}
                </p>
                <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  Built for university submission standards.
                </p>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Link
                      href="/auth/signin"
                      onClick={() => trackConversion("signup_click")}
                    >
                      <Button className="px-6 sm:px-8 py-3 sm:py-4 flex items-center gap-3 w-full sm:w-auto justify-center">
                        Start your thesis now
                        <ArrowRight size={18} />
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}
            {/* Trust Signals - Only show for control */}
            {abVariant === "control" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 sm:pt-6">
                <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 text-center sm:text-left">
                  <span className="text-3xl sm:text-4xl font-bold">Setup</span>
                  <p className="mt-2 text-[9px] sm:text-[10px] uppercase tracking-[0.24em] sm:tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                    In 2 minutes
                  </p>
                </div>
                <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 text-center sm:text-left">
                  <span className="text-3xl sm:text-4xl font-bold">
                    Citations
                  </span>
                  <p className="mt-2 text-[9px] sm:text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                    In seconds
                  </p>
                </div>
                <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-4 text-center sm:text-left">
                  <span className="text-3xl sm:text-4xl font-bold text-[hsl(var(--accent-foreground))]">
                    10+ hrs
                  </span>
                  <p className="mt-2 text-[9px] sm:text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--accent-foreground))]">
                    Saved monthly
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Lead Magnet Tool - Order: 1 on mobile, 2 on desktop */}
          <div className="lg:col-span-6 space-y-4 order-1 lg:order-2">
            {/* Lead Magnet Tool - Primary Position */}
            {(abVariant === "control" || abVariant === "variant_a") && (
              <HeroPlagiarismTool variant={abVariant} />
            )}
            {abVariant === "variant_b" && (
              <HeroTopicFinder variant={abVariant} />
            )}

            {/* Social Proof - Compact (Desktop Only - Hidden on Mobile) */}
            <div className="space-y-3 pt-2 hidden lg:block">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                Trusted by students & researchers
              </h3>
              <div className="grid gap-3">
                <div className="border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-3">
                  <div className="flex items-start gap-2">
                    <Star
                      className="text-[hsl(var(--accent))] flex-shrink-0 mt-0.5"
                      size={14}
                    />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--foreground))] italic">
                        &quot;Saved at least 10 hours every month.&quot;
                      </p>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-1">
                        — Fatima Adeoye, PhD Candidate, Europe
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-3">
                  <div className="flex items-start gap-2">
                    <Star
                      className="text-[hsl(var(--accent))] flex-shrink-0 mt-0.5"
                      size={14}
                    />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--foreground))] italic">
                        &quot;No last-minute Turnitin surprises.&quot;
                      </p>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-1">
                        — Anjali Patel, Masters Student, North America
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials Section - Mobile Only (Order: 3 - After Copy) */}
          <div className="lg:col-span-6 space-y-4 order-3 lg:hidden">
            {/* Social Proof - Mobile Only (shown after copy) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                Trusted by students & researchers
              </h3>
              <div className="grid gap-3">
                <div className="border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-3">
                  <div className="flex items-start gap-2">
                    <Star
                      className="text-[hsl(var(--accent))] flex-shrink-0 mt-0.5"
                      size={14}
                    />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--foreground))] italic">
                        &quot;Saved at least 10 hours every month.&quot;
                      </p>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-1">
                        — Fatima Adeoye, PhD Candidate, Europe
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-3">
                  <div className="flex items-start gap-2">
                    <Star
                      className="text-[hsl(var(--accent))] flex-shrink-0 mt-0.5"
                      size={14}
                    />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--foreground))] italic">
                        &quot;No last-minute Turnitin surprises.&quot;
                      </p>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-1">
                        — Anjali Patel, Masters Student, North America
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* A/B Test: Pain/Risk Section */}
        {abVariant === "variant_a" && (
          <section className="max-w-7xl mx-auto py-12 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.12em]">
                Deadlines leave no room for mistakes.
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Manual research eats time.
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Missing citations cost marks.
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Late fixes create panic.
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-6">
                <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--accent-foreground))] font-semibold">
                  Most students rush the hardest part.
                </p>
              </div>
            </div>
          </section>
        )}

        {abVariant === "variant_b" && (
          <section className="max-w-7xl mx-auto py-12 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.12em]">
                Most AI tools put students at risk.
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Fake citations fail review.
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Plagiarism flags appear late.
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Marks drop after submission.
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-6">
                <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--accent-foreground))] font-semibold">
                  Students submit work they do not trust.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* A/B Test: Solution Snapshot - Variant A */}
        {abVariant === "variant_a" && (
          <section className="max-w-7xl mx-auto py-12 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.12em]">
                Akowe speeds up academic writing.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Finds academic sources instantly
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Inserts citations while you write
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Prepares drafts ready for review
                </p>
              </div>
            </div>
            <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] font-semibold text-center">
              No backtracking. No rewriting.
            </p>
          </section>
        )}

        {abVariant === "variant_b" && (
          <section className="max-w-7xl mx-auto py-12 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.12em]">
                Akowe protects academic integrity.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Akowe supports responsible academic writing.
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  It focuses on real sources and citation accuracy.
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  It helps students submit work with confidence.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Value Strip */}
        <section className="max-w-7xl mx-auto py-8 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em]">
                AI that cites real academic sources
              </h3>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em]">
                Built-in similarity checks before Turnitin
              </h3>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em]">
                Write, cite, and submit in one workspace
              </h3>
            </div>
          </div>
        </section>

        {/* Work The Way Students Actually Work - Only show for control */}
        {abVariant === "control" && (
          <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]">
                Designed for real academic workflows
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Start literature reviews with built-in source search
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Structure thesis chapters without leaving the editor
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Keep notes, drafts, and citations together
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Export submission-ready DOCX or PDF
                </p>
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] text-center">
              Akọ̀wé is the academic writing tool built for thesis writing,
              dissertation work, and research papers.
            </p>
          </section>
        )}

        {/* A/B Test: Trust Section - Variant A */}
        {abVariant === "variant_a" && (
          <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]">
                Built for university submissions
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Designed for theses and research papers
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Uses verifiable academic sources
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Supports citation accuracy
                </p>
              </div>
            </div>
          </section>
        )}

        {/* A/B Test: Trust Section - Variant B */}
        {abVariant === "variant_b" && (
          <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]">
                Designed for academic submission
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Thesis and dissertation focused
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Citation accuracy first
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  Submission-ready output
                </p>
              </div>
            </div>
          </section>
        )}

        {abVariant === "variant_b" && (
          <section className="max-w-7xl mx-auto py-12 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.12em]">
                Designed for academic submission
              </h2>
              <ul className="space-y-3 text-base uppercase tracking-[0.16em] text-[hsl(var(--foreground))]">
                <li className="flex items-start gap-3">
                  <Check
                    className="text-[hsl(var(--primary))] mt-1 flex-shrink-0"
                    size={18}
                  />
                  <span>Thesis and dissertation focused</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check
                    className="text-[hsl(var(--primary))] mt-1 flex-shrink-0"
                    size={18}
                  />
                  <span>Citation accuracy first</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check
                    className="text-[hsl(var(--primary))] mt-1 flex-shrink-0"
                    size={18}
                  />
                  <span>Submission-ready output</span>
                </li>
              </ul>
            </div>
          </section>
        )}

        {/* A/B Test: Mid-Page CTA - Variant A */}
        {abVariant === "variant_a" && (
          <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]">
                Save hours on your thesis
              </h2>
              <Link
                href="/auth/signin"
                onClick={() => trackConversion("mid_page_cta_click")}
              >
                <Button className="px-8 py-4 flex items-center gap-3 mx-auto">
                  Start writing now
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                No setup. No credit card.
              </p>
            </div>
          </section>
        )}

        {/* A/B Test: Mid-Page CTA - Variant B */}
        {abVariant === "variant_b" && (
          <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]">
                Submit work you stand behind
              </h2>
              <Link
                href="/auth/signin"
                onClick={() => trackConversion("mid_page_cta_click")}
              >
                <Button className="px-8 py-4 flex items-center gap-3 mx-auto">
                  Start your thesis now
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                No setup. No credit card.
              </p>
            </div>
          </section>
        )}

        {/* A/B Test: FAQ Section - Variant A */}
        {abVariant === "variant_a" && (
          <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]">
                FAQ
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <h3 className="text-base font-semibold uppercase tracking-[0.16em] mb-3">
                  Who uses Akowe
                </h3>
                <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  Students writing theses and research papers.
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <h3 className="text-base font-semibold uppercase tracking-[0.16em] mb-3">
                  Are citations included
                </h3>
                <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  Yes. Citations appear as you write.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* A/B Test: FAQ Section - Variant B */}
        {abVariant === "variant_b" && (
          <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]">
                FAQ
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <h3 className="text-base font-semibold uppercase tracking-[0.16em] mb-3">
                  Does Akowe invent sources
                </h3>
                <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  No. Sources remain verifiable.
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <h3 className="text-base font-semibold uppercase tracking-[0.16em] mb-3">
                  Is similarity checked before submission
                </h3>
                <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  Yes. Review happens before export.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Why Choose Akọ̀wé - Only show for control */}
        {abVariant === "control" && (
          <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]">
                Why researchers choose Akọ̀wé
              </h2>
            </div>

            <div className="grid gap-6 mb-12">
              {/* Comparison Table */}
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] overflow-hidden">
                <div className="grid md:grid-cols-2">
                  <div className="p-6 border-b-2 md:border-b-0 md:border-r-2 border-[hsl(var(--border-strong))]">
                    <h3 className="text-lg font-semibold uppercase tracking-[0.16em] mb-4 text-[hsl(var(--muted-foreground))]">
                      Most tools
                    </h3>
                    <ul className="space-y-3 text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                      <li className="flex items-start gap-3">
                        <span className="text-[hsl(var(--destructive))] mt-1">
                          ✗
                        </span>
                        <span>Only do one thing</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[hsl(var(--destructive))] mt-1">
                          ✗
                        </span>
                        <span>Force you to copy and paste between apps</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[hsl(var(--destructive))] mt-1">
                          ✗
                        </span>
                        <span>Leave you guessing about plagiarism risk</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-6 bg-[hsl(var(--primary))]/10">
                    <h3 className="text-lg font-semibold uppercase tracking-[0.16em] mb-4 text-[hsl(var(--primary))]">
                      Akọ̀wé
                    </h3>
                    <ul className="space-y-3 text-sm uppercase tracking-[0.18em] text-[hsl(var(--foreground))]">
                      <li className="flex items-start gap-3">
                        <Check
                          className="text-[hsl(var(--primary))] mt-1 flex-shrink-0"
                          size={18}
                        />
                        <span>
                          One workspace for writing, citations, and integrity
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check
                          className="text-[hsl(var(--primary))] mt-1 flex-shrink-0"
                          size={18}
                        />
                        <span>Real academic sources</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check
                          className="text-[hsl(var(--primary))] mt-1 flex-shrink-0"
                          size={18}
                        />
                        <span>Pre-submission similarity safety</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* How It Works - Show for all variants */}
        <section
          id="features"
          className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]"
        >
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]">
              How it works
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-3">1</div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] mb-2">
                Enter your topic
              </h3>
              <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                Start a new project with your thesis topic or research question
              </p>
            </div>
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-3">2</div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] mb-2">
                Write with real sources
              </h3>
              <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                AI assists your writing while pulling citations from academic
                databases
              </p>
            </div>
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-3">3</div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] mb-2">
                Review & submit
              </h3>
              <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                Check plagiarism, verify citations, and export submission-ready
                documents
              </p>
            </div>
          </div>
        </section>

        {/* Features Section - Show for all variants */}
        <section className="max-w-7xl mx-auto py-20 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em]">
              Everything you need for serious academic writing
            </h2>
            <p className="text-sm sm:text-base uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] max-w-3xl mx-auto">
              Stop switching between tools. Write in one focused workspace.
            </p>
          </div>

          {/* Feature 1: AI Writing Support */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                  AI Writing Support
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.12em]">
                  Write faster. Sound scholarly. Stay original.
                </h3>
              </div>
              <p className="text-base uppercase tracking-[0.16em] text-[hsl(var(--foreground))]">
                Outline, draft, and refine inside a structured editor. Get
                clarity suggestions, academic tone guidance, and citations tied
                to real sources.
              </p>
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

          {/* Feature 2: Real Citations */}
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
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                  Real Citations
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.12em]">
                  Real sources. Real citations.
                </h3>
              </div>
              <p className="text-base uppercase tracking-[0.16em] text-[hsl(var(--foreground))]">
                Search trusted academic databases like Crossref and OpenAlex.
                Insert accurate references and manage citations without leaving
                your document.
              </p>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-4 mt-4">
                <p className="text-xs uppercase tracking-[0.2em]">
                  No fabricated references. No blind AI output.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3: Integrity & Plagiarism Safety */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                  Integrity & Plagiarism Safety
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.12em]">
                  Avoid submission shocks.
                </h3>
              </div>
              <p className="text-base uppercase tracking-[0.16em] text-[hsl(var(--foreground))]">
                Check originality before you upload. See similarity insights
                aligned with common university standards so you fix issues
                early.
              </p>
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

          {/* Ethical AI Trust Badge */}
          <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-6 mt-16">
            <h4 className="text-lg font-semibold uppercase tracking-[0.16em] mb-4">
              AI guidance built for academic use
            </h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm uppercase tracking-[0.18em]">
              <div>
                <p className="font-semibold mb-1">No fabricated references</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Supports ethical writing</p>
              </div>
              <div>
                <p className="font-semibold mb-1">
                  Built for academic integrity
                </p>
              </div>
            </div>
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
                AI words include assistant responses, AI-written content, and
                outlines. Your own writing never counts toward the limit.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAnnual(false)}
                className={cn(
                  "px-4 py-2 border-2 border-[hsl(var(--border-strong))] text-xs font-semibold uppercase tracking-[0.24em] transition-transform duration-150",
                  !isAnnual
                    ? "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] -translate-x-[0.125rem] -translate-y-[0.125rem]"
                    : "bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={cn(
                  "px-4 py-2 border-2 border-[hsl(var(--border-strong))] text-xs font-semibold uppercase tracking-[0.24em] transition-transform duration-150",
                  isAnnual
                    ? "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] -translate-x-[0.125rem] -translate-y-[0.125rem]"
                    : "bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]"
                )}
              >
                Annual
              </button>
              <span
                className={cn(
                  "px-3 py-2 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[10px] font-semibold uppercase tracking-[0.28em] text-[hsl(var(--accent-foreground))] transition-opacity duration-200 min-w-[110px] text-center",
                  isAnnual ? "opacity-100" : "opacity-0"
                )}
                aria-hidden={!isAnnual}
              >
                Save{" "}
                {formatDiscountPercentage(
                  getProPlanDiscount().discountPercentage
                )}
              </span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 flex flex-col gap-6">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                  Free plan
                </span>
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
                  <Check size={16} />3 plagiarism checks per day
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />3 projects maximum
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
                <span className="text-xs uppercase tracking-[0.32em]">
                  Pro plan
                </span>
                <span className="text-5xl font-bold">
                  {isAnnual ? "$120" : "$12"}
                </span>
                <p className="text-[10px] uppercase tracking-[0.28em]">
                  {isAnnual
                    ? "Billed once annually."
                    : "Billed monthly on flexible billing."}
                </p>
                <p
                  className={cn(
                    "text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--foreground))] min-h-[14px]"
                  )}
                >
                  {isAnnual ? (
                    "≈$10/mo equivalent"
                  ) : (
                    <span className="font-semibold">First month 15% off</span>
                  )}
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
                <Button className="w-full py-4">Upgrade to Pro</Button>
              </Link>
              <p className="text-[10px] uppercase tracking-[0.24em] text-center">
                Built for academic integrity · You own your work
              </p>
            </div>

            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 flex flex-col gap-6 opacity-80">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                  Team plan
                </span>
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
                Replace fragmented tooling with a single studio that respects
                scholarly standards. Trusted by students and researchers across
                universities.
              </p>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-4 mt-6">
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--foreground))]">
                  <strong>Academic-First Design:</strong> Every feature built
                  specifically for scholarly work, not retrofitted from generic
                  tools.
                </p>
              </div>
            </div>
            <div className="lg:col-span-7 grid gap-4">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <h4 className="text-sm font-semibold uppercase tracking-[0.24em] mb-3">
                  All-in-one workflow
                </h4>
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  Drafting, citations, plagiarism checks, and exports live
                  together so work stays organized.
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-6">
                <h4 className="text-sm font-semibold uppercase tracking-[0.24em] mb-3">
                  Designed for academics
                </h4>
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--foreground))]">
                  Structured sections, methodology prompts, and citation
                  intelligence keep research on track.
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <h4 className="text-sm font-semibold uppercase tracking-[0.24em] mb-3">
                  Predictable pricing
                </h4>
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  Our Pro plan averages 50% less than stitching together
                  single-purpose tools.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center space-y-2">
              <span className="text-4xl font-extrabold uppercase tracking-[0.1em]">
                50%+
              </span>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                Savings versus separate writing, citation, and plagiarism tools.
              </p>
            </div>
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-6 text-center space-y-2 text-[hsl(var(--accent-foreground))]">
              <span className="text-4xl font-extrabold uppercase tracking-[0.1em]">
                All-in-one
              </span>
              <p className="text-[10px] uppercase tracking-[0.28em]">
                AI drafting, citations, PDF analysis, and export in a single
                workspace.
              </p>
            </div>
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center space-y-2">
              <span className="text-4xl font-extrabold uppercase tracking-[0.1em]">
                10 hrs
              </span>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                Average time saved every month for scholars using Akọ̀wé.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action - Variant Specific */}
      {abVariant === "control" && (
        <section className="px-6 sm:px-8 lg:px-12 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="max-w-7xl mx-auto py-20 text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em]">
              Write better research with less stress.
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signin"
                onClick={() => trackConversion("final_cta_click")}
              >
                <Button className="px-8 py-4 flex items-center gap-3">
                  Start free
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              No setup stress. No risky output.
            </p>
          </div>
        </section>
      )}

      {abVariant === "variant_a" && (
        <section className="px-6 sm:px-8 lg:px-12 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="max-w-7xl mx-auto py-20 text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em]">
              Finish faster. Submit with confidence.
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signin"
                onClick={() => trackConversion("final_cta_click")}
              >
                <Button className="px-8 py-4 flex items-center gap-3">
                  Start writing now
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {abVariant === "variant_b" && (
        <section className="px-6 sm:px-8 lg:px-12 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="max-w-7xl mx-auto py-20 text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em]">
              Protect your academic work.
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signin"
                onClick={() => trackConversion("final_cta_click")}
              >
                <Button className="px-8 py-4 flex items-center gap-3">
                  Start your thesis now
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <footer className="border-t-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-xl font-semibold uppercase tracking-[0.16em]">
              Akọ̀wé
            </h4>
            <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
              Academic writing tool • AI for thesis writing • citation
              management software • plagiarism checker for research papers
            </p>
          </div>
          <nav className="flex gap-6 text-xs uppercase tracking-[0.28em]">
            <Link
              href="/about"
              className="hover:text-[hsl(var(--secondary))] transition-colors"
            >
              Learn our story
            </Link>
            <Link
              href="/blog"
              className="hover:text-[hsl(var(--secondary))] transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/privacy"
              className="hover:text-[hsl(var(--secondary))] transition-colors"
            >
              Privacy
            </Link>
          </nav>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
            © 2025 Akọ̀wé. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Exit Intent Popup - Backup capture for users who scroll past (not for variant_b) */}
      {(abVariant === "control" || abVariant === "variant_a") && (
        <ExitIntentPopup variant={abVariant} tool="plagiarism" />
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[hsl(var(--background))] animate-pulse" />
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
