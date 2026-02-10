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
              <a
                href="https://blog.useakowe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[hsl(var(--secondary))] transition-colors"
              >
                {tCommon("blog")}
              </a>
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
                  {tHome("heroVariantB.tagline")}
                </p>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Link
                      href="/auth/signin"
                      onClick={() => trackConversion("signup_click")}
                    >
                      <Button className="px-6 sm:px-8 py-3 sm:py-4 flex items-center gap-3 w-full sm:w-auto justify-center">
                        {tHome("heroVariantB.cta")}
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
                  <span className="text-3xl sm:text-4xl font-bold">{tHome("trustSignals.setup")}</span>
                  <p className="mt-2 text-[9px] sm:text-[10px] uppercase tracking-[0.24em] sm:tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                    {tHome("trustSignals.setupSub")}
                  </p>
                </div>
                <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 text-center sm:text-left">
                  <span className="text-3xl sm:text-4xl font-bold">
                    {tHome("trustSignals.citations")}
                  </span>
                  <p className="mt-2 text-[9px] sm:text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                    {tHome("trustSignals.citationsSub")}
                  </p>
                </div>
                <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-4 text-center sm:text-left">
                  <span className="text-3xl sm:text-4xl font-bold text-[hsl(var(--accent-foreground))]">
                    {tHome("trustSignals.saved")}
                  </span>
                  <p className="mt-2 text-[9px] sm:text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--accent-foreground))]">
                    {tHome("trustSignals.savedSub")}
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
                {tHome("socialProof.title")}
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
                        &quot;{tHome("socialProof.testimonial1Quote")}&quot;
                      </p>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-1">
                        {tHome("socialProof.testimonial1Author")}
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
                        &quot;{tHome("socialProof.testimonial2Quote")}&quot;
                      </p>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-1">
                        {tHome("socialProof.testimonial2Author")}
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
                {tHome("socialProof.title")}
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
                        &quot;{tHome("socialProof.testimonial1Quote")}&quot;
                      </p>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-1">
                        {tHome("socialProof.testimonial1Author")}
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
                        &quot;{tHome("socialProof.testimonial2Quote")}&quot;
                      </p>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-1">
                        {tHome("socialProof.testimonial2Author")}
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
                {tHome("painA.heading")}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("painA.manualResearch")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("painA.missingCitations")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("painA.lateFixes")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-6">
                <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--accent-foreground))] font-semibold">
                  {tHome("painA.mostRush")}
                </p>
              </div>
            </div>
          </section>
        )}

        {abVariant === "variant_b" && (
          <section className="max-w-7xl mx-auto py-12 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.12em]">
                {tHome("painB.heading")}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("painB.fakeCitations")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("painB.plagiarismFlags")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("painB.marksDrop")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-6">
                <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--accent-foreground))] font-semibold">
                  {tHome("painB.submitNoTrust")}
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
                {tHome("solutionA.heading")}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("solutionA.findsSources")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("solutionA.insertsCitations")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("solutionA.preparesDrafts")}
                </p>
              </div>
            </div>
            <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] font-semibold text-center">
              {tHome("solutionA.noBacktracking")}
            </p>
          </section>
        )}

        {abVariant === "variant_b" && (
          <section className="max-w-7xl mx-auto py-12 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.12em]">
                {tHome("solutionB.heading")}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("solutionB.supportsResponsible")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("solutionB.realSources")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("solutionB.submitConfidence")}
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
                {tHome("valueStrip.realSources")}
              </h3>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em]">
                {tHome("valueStrip.similarityChecks")}
              </h3>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em]">
                {tHome("valueStrip.workspace")}
              </h3>
            </div>
          </div>
        </section>

        {/* Work The Way Students Actually Work - Only show for control */}
        {abVariant === "control" && (
          <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]">
                {tHome("workflows.heading")}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("workflows.litReview")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("workflows.structureChapters")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("workflows.notesDrafts")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("workflows.export")}
                </p>
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] text-center">
              {tHome("workflows.tagline")}
            </p>
          </section>
        )}

        {/* A/B Test: Trust Section - Variant A */}
        {abVariant === "variant_a" && (
          <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]">
                {tHome("trustA.heading")}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("trustA.thesesPapers")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("trustA.verifiableSources")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("trustA.citationAccuracy")}
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
                {tHome("trustB.heading")}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("trustB.thesisFocused")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("trustB.citationFirst")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
                <p className="text-sm uppercase tracking-[0.18em]">
                  {tHome("trustB.submissionReady")}
                </p>
              </div>
            </div>
          </section>
        )}

        {abVariant === "variant_b" && (
          <section className="max-w-7xl mx-auto py-12 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.12em]">
                {tHome("trustB.heading")}
              </h2>
              <ul className="space-y-3 text-base uppercase tracking-[0.16em] text-[hsl(var(--foreground))]">
                <li className="flex items-start gap-3">
                  <Check
                    className="text-[hsl(var(--primary))] mt-1 flex-shrink-0"
                    size={18}
                  />
                  <span>{tHome("trustB.thesisFocused")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check
                    className="text-[hsl(var(--primary))] mt-1 flex-shrink-0"
                    size={18}
                  />
                  <span>{tHome("trustB.citationFirst")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check
                    className="text-[hsl(var(--primary))] mt-1 flex-shrink-0"
                    size={18}
                  />
                  <span>{tHome("trustB.submissionReady")}</span>
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
                {tHome("ctaMid.variantAHeading")}
              </h2>
              <Link
                href="/auth/signin"
                onClick={() => trackConversion("mid_page_cta_click")}
              >
                <Button className="px-8 py-4 flex items-center gap-3 mx-auto">
                  {tHome("ctaMid.variantAButton")}
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                {tHome("ctaMid.variantANoSetup")}
              </p>
            </div>
          </section>
        )}

        {/* A/B Test: Mid-Page CTA - Variant B */}
        {abVariant === "variant_b" && (
          <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]">
                {tHome("ctaMid.variantBHeading")}
              </h2>
              <Link
                href="/auth/signin"
                onClick={() => trackConversion("mid_page_cta_click")}
              >
                <Button className="px-8 py-4 flex items-center gap-3 mx-auto">
                  {tHome("ctaMid.variantBButton")}
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                {tHome("ctaMid.variantBNoSetup")}
              </p>
            </div>
          </section>
        )}

        {/* A/B Test: FAQ Section - Variant A */}
        {abVariant === "variant_a" && (
          <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]">
                {tHome("faq.title")}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <h3 className="text-base font-semibold uppercase tracking-[0.16em] mb-3">
                  {tHome("faq.whoUses")}
                </h3>
                <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  {tHome("faq.whoUsesAnswer")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <h3 className="text-base font-semibold uppercase tracking-[0.16em] mb-3">
                  {tHome("faq.citationsIncluded")}
                </h3>
                <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  {tHome("faq.citationsIncludedAnswer")}
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
                {tHome("faq.title")}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <h3 className="text-base font-semibold uppercase tracking-[0.16em] mb-3">
                  {tHome("faq.doesInvent")}
                </h3>
                <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  {tHome("faq.doesInventAnswer")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <h3 className="text-base font-semibold uppercase tracking-[0.16em] mb-3">
                  {tHome("faq.similarityChecked")}
                </h3>
                <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  {tHome("faq.similarityCheckedAnswer")}
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
                {tHome("whyChoose.heading")}
              </h2>
            </div>

            <div className="grid gap-6 mb-12">
              {/* Comparison Table */}
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] overflow-hidden">
                <div className="grid md:grid-cols-2">
                  <div className="p-6 border-b-2 md:border-b-0 md:border-r-2 border-[hsl(var(--border-strong))]">
                    <h3 className="text-lg font-semibold uppercase tracking-[0.16em] mb-4 text-[hsl(var(--muted-foreground))]">
                      {tHome("whyChoose.mostTools")}
                    </h3>
                    <ul className="space-y-3 text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                      <li className="flex items-start gap-3">
                        <span className="text-[hsl(var(--destructive))] mt-1">
                          ✗
                        </span>
                        <span>{tHome("whyChoose.onlyOneThing")}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[hsl(var(--destructive))] mt-1">
                          ✗
                        </span>
                        <span>{tHome("whyChoose.forceCopyPaste")}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[hsl(var(--destructive))] mt-1">
                          ✗
                        </span>
                        <span>{tHome("whyChoose.guessingPlagiarism")}</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-6 bg-[hsl(var(--primary))]/10">
                    <h3 className="text-lg font-semibold uppercase tracking-[0.16em] mb-4 text-[hsl(var(--primary))]">
                      {tHome("whyChoose.akowe")}
                    </h3>
                    <ul className="space-y-3 text-sm uppercase tracking-[0.18em] text-[hsl(var(--foreground))]">
                      <li className="flex items-start gap-3">
                        <Check
                          className="text-[hsl(var(--primary))] mt-1 flex-shrink-0"
                          size={18}
                        />
                        <span>
                          {tHome("whyChoose.oneWorkspace")}
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check
                          className="text-[hsl(var(--primary))] mt-1 flex-shrink-0"
                          size={18}
                        />
                        <span>{tHome("whyChoose.realSources")}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check
                          className="text-[hsl(var(--primary))] mt-1 flex-shrink-0"
                          size={18}
                        />
                        <span>{tHome("whyChoose.preSubmissionSafety")}</span>
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
              {tHome("howItWorks.heading")}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-3">1</div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] mb-2">
                {tHome("howItWorks.step1Title")}
              </h3>
              <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                {tHome("howItWorks.step1Desc")}
              </p>
            </div>
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-3">2</div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] mb-2">
                {tHome("howItWorks.step2Title")}
              </h3>
              <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                {tHome("howItWorks.step2Desc")}
              </p>
            </div>
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-3">3</div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] mb-2">
                {tHome("howItWorks.step3Title")}
              </h3>
              <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                {tHome("howItWorks.step3Desc")}
              </p>
            </div>
          </div>
        </section>

        {/* Features Section - Show for all variants */}
        <section className="max-w-7xl mx-auto py-20 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em]">
              {tHome("features.heading")}
            </h2>
            <p className="text-sm sm:text-base uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] max-w-3xl mx-auto">
              {tHome("features.subheading")}
            </p>
          </div>

          {/* Feature 1: AI Writing Support */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                  {tHome("features.feature1Label")}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.12em]">
                  {tHome("features.feature1Title")}
                </h3>
              </div>
              <p className="text-base uppercase tracking-[0.16em] text-[hsl(var(--foreground))]">
                {tHome("features.feature1Desc")}
              </p>
            </div>
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
              <Image
                src="/feature-ai-assistant.png"
                alt={tHome("imageAlt.aiAssistant")}
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
                  {tHome("features.feature2Label")}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.12em]">
                  {tHome("features.feature2Title")}
                </h3>
              </div>
              <p className="text-base uppercase tracking-[0.16em] text-[hsl(var(--foreground))]">
                {tHome("features.feature2Desc")}
              </p>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-4 mt-4">
                <p className="text-xs uppercase tracking-[0.2em]">
                  {tHome("features.feature2Badge")}
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3: Integrity & Plagiarism Safety */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                  {tHome("features.feature3Label")}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.12em]">
                  {tHome("features.feature3Title")}
                </h3>
              </div>
              <p className="text-base uppercase tracking-[0.16em] text-[hsl(var(--foreground))]">
                {tHome("features.feature3Desc")}
              </p>
            </div>
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 rounded-lg">
              <Image
                src="/feature-plagiarism-check.png"
                alt={tHome("imageAlt.plagiarismCheck")}
                width={800}
                height={600}
                className="w-full border-2 border-[hsl(var(--border-strong))] rounded"
              />
            </div>
          </div>

          {/* Ethical AI Trust Badge */}
          <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-6 mt-16">
            <h4 className="text-lg font-semibold uppercase tracking-[0.16em] mb-4">
              {tHome("features.ethicalBadgeTitle")}
            </h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm uppercase tracking-[0.18em]">
              <div>
                <p className="font-semibold mb-1">{tHome("features.ethicalNoFabricated")}</p>
              </div>
              <div>
                <p className="font-semibold mb-1">{tHome("features.ethicalSupportsWriting")}</p>
              </div>
              <div>
                <p className="font-semibold mb-1">
                  {tHome("features.ethicalBuiltForIntegrity")}
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
              {tHome("plans.label")}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em]">
              {tHome("plans.heading")}
            </h2>
            <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
              {tHome("plans.subheading")}
            </p>
          </div>

          <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 md:p-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl space-y-2">
              <span className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                {tHome("plans.aiWordsLabel")}
              </span>
              <p className="text-sm uppercase tracking-[0.2em] text-[hsl(var(--foreground))]">
                {tHome("plans.aiWordsDesc")}
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
                {tHome("plans.monthly")}
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
                {tHome("plans.annual")}
              </button>
              <span
                className={cn(
                  "px-3 py-2 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[10px] font-semibold uppercase tracking-[0.28em] text-[hsl(var(--accent-foreground))] transition-opacity duration-200 min-w-[110px] text-center",
                  isAnnual ? "opacity-100" : "opacity-0"
                )}
                aria-hidden={!isAnnual}
              >
                {tHome("plans.save")}{" "}
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
                  {tHome("plans.freePlanLabel")}
                </span>
                <span className="text-5xl font-bold">{tHome("plans.freePlanPrice")}</span>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                  {tHome("plans.freePlanDesc")}
                </p>
              </div>
              <ul className="space-y-3 text-xs uppercase tracking-[0.24em] text-[hsl(var(--foreground))]">
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.freePlanAiWords")}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.freePlanPlagiarismChecks")}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.freePlanProjects")}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.freePlanCitationSearch")}
                </li>
              </ul>
              <Link href="/auth/signin">
                <Button variant="outline" className="w-full py-4">
                  {tCommon("getStarted")}
                </Button>
              </Link>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] text-center">
                {tHome("plans.freePlanNoCard")}
              </p>
            </div>

            <div className="relative border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-8 flex flex-col gap-6">
              <span className="absolute -top-4 left-4 px-3 py-1 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-[10px] font-semibold uppercase tracking-[0.3em] text-[hsl(var(--foreground))]">
                {tHome("plans.proPlanBadge")}
              </span>
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.32em]">
                  {tHome("plans.proPlanLabel")}
                </span>
                <span className="text-5xl font-bold">
                  {isAnnual ? tHome("plans.proPlanPriceAnnual") : tHome("plans.proPlanPriceMonthly")}
                </span>
                <p className="text-[10px] uppercase tracking-[0.28em]">
                  {isAnnual
                    ? tHome("plans.proPlanBilledAnnual")
                    : tHome("plans.proPlanBilledMonthly")}
                </p>
                <p
                  className={cn(
                    "text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--foreground))] min-h-[14px]"
                  )}
                >
                  {isAnnual ? (
                    tHome("plans.proPlanEquivalent")
                  ) : (
                    <span className="font-semibold">{tHome("plans.proPlanFirstMonthOff")}</span>
                  )}
                </p>
              </div>
              <ul className="space-y-3 text-xs uppercase tracking-[0.24em]">
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.proPlanUnlimitedWords")}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.proPlanUnlimitedChecks")}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.proPlanUnlimitedProjects")}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.proPlanAdvancedSearch")}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.proPlanAdvancedAI")}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.proPlanPrioritySupport")}
                </li>
              </ul>
              <Link href="/auth/signin">
                <Button className="w-full py-4">{tHome("plans.proPlanCta")}</Button>
              </Link>
              <p className="text-[10px] uppercase tracking-[0.24em] text-center">
                {tHome("plans.proPlanTagline")}
              </p>
            </div>

            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 flex flex-col gap-6 opacity-80">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                  {tHome("plans.teamPlanLabel")}
                </span>
                <span className="text-4xl font-bold">{tHome("plans.teamPlanComingSoon")}</span>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                  {tHome("plans.teamPlanDesc")}
                </p>
              </div>
              <ul className="space-y-3 text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.teamPlanEverythingInPro")}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.teamPlanSharedWorkspaces")}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.teamPlanAdminControls")}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.teamPlanCentralBibliography")}
                </li>
              </ul>
              <Button variant="ghost" className="w-full py-4" disabled>
                {tHome("plans.teamPlanCta")}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-20 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                {tHome("academicAlignment.label")}
              </span>
              <h3 className="text-3xl font-semibold uppercase tracking-[0.16em]">
                {tHome("academicAlignment.heading")}
              </h3>
              <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                {tHome("academicAlignment.desc")}
              </p>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-4 mt-6">
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--foreground))]">
                  <strong>{tHome("academicAlignment.designTitle")}</strong> {tHome("academicAlignment.designDesc")}
                </p>
              </div>
            </div>
            <div className="lg:col-span-7 grid gap-4">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <h4 className="text-sm font-semibold uppercase tracking-[0.24em] mb-3">
                  {tHome("academicAlignment.allInOneTitle")}
                </h4>
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  {tHome("academicAlignment.allInOneDesc")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-6">
                <h4 className="text-sm font-semibold uppercase tracking-[0.24em] mb-3">
                  {tHome("academicAlignment.designedTitle")}
                </h4>
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--foreground))]">
                  {tHome("academicAlignment.designedDesc")}
                </p>
              </div>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                <h4 className="text-sm font-semibold uppercase tracking-[0.24em] mb-3">
                  {tHome("academicAlignment.pricingTitle")}
                </h4>
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  {tHome("academicAlignment.pricingDesc")}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center space-y-2">
              <span className="text-4xl font-extrabold uppercase tracking-[0.1em]">
                {tHome("stats.savings")}
              </span>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                {tHome("stats.savingsDesc")}
              </p>
            </div>
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-6 text-center space-y-2 text-[hsl(var(--accent-foreground))]">
              <span className="text-4xl font-extrabold uppercase tracking-[0.1em]">
                {tHome("stats.allInOne")}
              </span>
              <p className="text-[10px] uppercase tracking-[0.28em]">
                {tHome("stats.allInOneDesc")}
              </p>
            </div>
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center space-y-2">
              <span className="text-4xl font-extrabold uppercase tracking-[0.1em]">
                {tHome("stats.tenHours")}
              </span>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                {tHome("stats.tenHoursDesc")}
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
              {tHome("finalCta.controlHeading")}
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signin"
                onClick={() => trackConversion("final_cta_click")}
              >
                <Button className="px-8 py-4 flex items-center gap-3">
                  {tCommon("startFree")}
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              {tHome("finalCta.controlSub")}
            </p>
          </div>
        </section>
      )}

      {abVariant === "variant_a" && (
        <section className="px-6 sm:px-8 lg:px-12 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="max-w-7xl mx-auto py-20 text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em]">
              {tHome("finalCta.variantAHeading")}
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signin"
                onClick={() => trackConversion("final_cta_click")}
              >
                <Button className="px-8 py-4 flex items-center gap-3">
                  {tCommon("startWritingNow")}
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
              {tHome("finalCta.variantBHeading")}
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signin"
                onClick={() => trackConversion("final_cta_click")}
              >
                <Button className="px-8 py-4 flex items-center gap-3">
                  {tHome("heroVariantB.cta")}
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
              {tHome("footer.brand")}
            </h4>
            <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
              {tHome("footer.tagline")}
            </p>
          </div>
          <nav className="flex gap-6 text-xs uppercase tracking-[0.28em]">
            <Link
              href="/about"
              className="hover:text-[hsl(var(--secondary))] transition-colors"
            >
              {tHome("footer.learnStory")}
            </Link>
            <a
              href="https://blog.useakowe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[hsl(var(--secondary))] transition-colors"
            >
              {tCommon("blog")}
            </a>
            <Link
              href="/privacy"
              className="hover:text-[hsl(var(--secondary))] transition-colors"
            >
              {tHome("footer.privacy")}
            </Link>
          </nav>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
            &copy; {new Date().getFullYear()} {tHome("footer.brand")}. {tHome("footer.copyright")}
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
