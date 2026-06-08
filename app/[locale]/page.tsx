"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import {
  Check,
  ArrowRight,
  Star,
  Search,
  BookOpen,
  Shield,
  FileText,
  Microscope,
  Layout,
  MessageSquare,
} from "lucide-react";
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

const NEEDS = [
  {
    id: "topic",
    label: "Finding a research topic",
    icon: Search,
    target: "feature-ai",
  },
  {
    id: "litreview",
    label: "Writing literature review",
    icon: BookOpen,
    target: "feature-ai",
  },
  {
    id: "plagiarism",
    label: "Checking plagiarism",
    icon: Shield,
    target: "feature-plagiarism",
  },
  {
    id: "citations",
    label: "Citations & references",
    icon: FileText,
    target: "feature-citations",
  },
  {
    id: "methodology",
    label: "Methodology chapter",
    icon: Microscope,
    target: "feature-ai",
  },
  {
    id: "structure",
    label: "Thesis structure",
    icon: Layout,
    target: "feature-ai",
  },
  {
    id: "revisions",
    label: "Supervisor revisions",
    icon: MessageSquare,
    target: "feature-review",
  },
] as const;

function HomePageContent() {
  const searchParams = useSearchParams();
  useSession();
  const tCommon = useTranslations("common");
  const tHome = useTranslations("home");
  const [isAnnual, setIsAnnual] = useState(false);
  const [abVariant, setAbVariant] = useState<
    "control" | "variant_a" | "variant_b"
  >("control");
  const [channelVariant, setChannelVariant] =
    useState<LandingPageVariant>("default");
  const [activeNeed, setActiveNeed] = useState<string | null>(null);

  useEffect(() => {
    const variant = getABVariant();
    setAbVariant(variant);

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

    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "ab_test_viewed", {
        experiment_name: "landing_page_headline_v1",
        variant: variant,
        timestamp: Date.now(),
      });

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

  const handleNeedClick = (need: (typeof NEEDS)[number]) => {
    setActiveNeed(need.id);
    const el = document.getElementById(need.target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-4 sm:h-auto lg:py-0 lg:h-20">
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
                className="hover:text-[hsl(var(--secondary))] transition-colors min-h-auto!"
              >
                {tCommon("blog")}
              </a>
              <Link
                href="/pricing"
                className="hover:text-[hsl(var(--secondary))] transition-colors min-h-auto!"
              >
                Pricing
              </Link>
              <Link
                href="/tools/reference-checker"
                className="hidden sm:block hover:text-[hsl(var(--secondary))] transition-colors min-h-auto!"
              >
                Free Tools
              </Link>
              <Link
                href="/auth/signin"
                className="hover:text-[hsl(var(--secondary))] transition-colors min-h-auto!"
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
        {/* ── Hero ── */}
        <section className="max-w-7xl mx-auto py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Copy */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-7 order-2 lg:order-1">
            {abVariant === "control" ? (
              <>
                <h1 className="text-3xl sm:text-5xl lg:text-5xl font-bold uppercase tracking-[0.04em] sm:tracking-[0.06em] leading-tight">
                  {tHome("heroControl.title")}
                </h1>
                <p className="text-base sm:text-lg tracking-[0.04em] sm:tracking-[0.08em] text-[hsl(var(--muted-foreground))] font-normal leading-relaxed">
                  {tHome("heroControl.subtitle")}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Link
                    href="/auth/signin"
                    onClick={() => trackConversion("signup_click")}
                  >
                    <Button className="px-6 sm:px-8 py-3 sm:py-4 flex items-center gap-3 w-full sm:w-auto justify-center">
                      Start Your Thesis Free
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
              </>
            ) : abVariant === "variant_a" ? (
              <>
                <h1 className="text-3xl sm:text-5xl lg:text-5xl font-bold uppercase tracking-[0.04em] sm:tracking-[0.06em] leading-tight">
                  {tHome("heroVariantA.title")}
                </h1>
                <p className="text-base sm:text-lg tracking-[0.04em] sm:tracking-[0.08em] text-[hsl(var(--muted-foreground))] font-normal leading-relaxed">
                  {tHome("heroVariantA.subtitle")}
                </p>
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
              </>
            ) : (
              <>
                <h1 className="text-3xl sm:text-5xl lg:text-5xl font-bold uppercase tracking-[0.04em] sm:tracking-[0.06em] leading-tight">
                  {tHome("heroVariantB.title")}
                </h1>
                <p className="text-base sm:text-lg tracking-[0.04em] sm:tracking-[0.08em] text-[hsl(var(--muted-foreground))] font-normal leading-relaxed">
                  {tHome("heroVariantB.subtitle")}
                </p>
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
              </>
            )}

            {/* Trust signals */}
            {abVariant === "control" && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 text-center">
                  <span className="text-2xl sm:text-3xl font-bold">
                    {tHome("trustSignals.setup")}
                  </span>
                  <p className="mt-1.5 text-[9px] uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
                    {tHome("trustSignals.setupSub")}
                  </p>
                </div>
                <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 sm:p-4 text-center">
                  <span className="text-2xl sm:text-3xl font-bold">
                    {tHome("trustSignals.citations")}
                  </span>
                  <p className="mt-1.5 text-[9px] uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
                    {tHome("trustSignals.citationsSub")}
                  </p>
                </div>
                <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-3 sm:p-4 text-center">
                  <span className="text-2xl sm:text-3xl font-bold text-[hsl(var(--accent-foreground))]">
                    {tHome("trustSignals.saved")}
                  </span>
                  <p className="mt-1.5 text-[9px] uppercase tracking-[0.22em] text-[hsl(var(--accent-foreground))]">
                    {tHome("trustSignals.savedSub")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Lead Magnet Tool */}
          <div className="lg:col-span-6 space-y-4 order-1 lg:order-2">
            {(abVariant === "control" || abVariant === "variant_a") && (
              <HeroPlagiarismTool variant={abVariant} />
            )}
            {abVariant === "variant_b" && (
              <HeroTopicFinder variant={abVariant} />
            )}

            {/* Social proof — desktop */}
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
                      <p className="text-[11px] tracking-[0.08em] text-[hsl(var(--foreground))] italic">
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
                      <p className="text-[11px] tracking-[0.08em] text-[hsl(var(--foreground))] italic">
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

          {/* Social proof — mobile (after copy) */}
          <div className="lg:col-span-12 space-y-3 order-3 lg:hidden">
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
                    <p className="text-[12px] leading-relaxed tracking-[0.04em] text-[hsl(var(--foreground))] italic">
                      &quot;{tHome("socialProof.testimonial1Quote")}&quot;
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))] mt-1.5">
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
                    <p className="text-[12px] leading-relaxed tracking-[0.04em] text-[hsl(var(--foreground))] italic">
                      &quot;{tHome("socialProof.testimonial2Quote")}&quot;
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))] mt-1.5">
                      {tHome("socialProof.testimonial2Author")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Choose What You Need Help With ── */}
        <section className="max-w-7xl mx-auto py-12 border-t-[4px] border-[hsl(var(--border-strong))]">
          <p className="text-center text-[10px] uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-6">
            Choose what you need help with
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {NEEDS.map((need) => {
              const Icon = need.icon;
              return (
                <button
                  key={need.id}
                  onClick={() => handleNeedClick(need)}
                  className={cn(
                    "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-[hsl(var(--border-strong))] text-[11px] sm:text-xs font-medium tracking-[0.1em] sm:tracking-[0.14em] transition-all duration-150",
                    activeNeed === need.id
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] -translate-x-[0.125rem] -translate-y-[0.125rem]"
                      : "bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--primary))]/10 hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]"
                  )}
                >
                  <Icon size={13} />
                  {need.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Feature Screenshots (moved before How It Works) ── */}
        <section
          id="features"
          className="max-w-7xl mx-auto py-20 border-t-[4px] border-[hsl(var(--border-strong))]"
        >
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em]">
              {tHome("features.heading")}
            </h2>
            <p className="text-sm tracking-[0.08em] text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto leading-relaxed">
              {tHome("features.subheading")}
            </p>
          </div>

          {/* Feature 1: AI Writing */}
          <div
            id="feature-ai"
            className="grid lg:grid-cols-2 gap-12 items-center mb-20 scroll-mt-24"
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                  {tHome("features.feature1Label")}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.1em]">
                  {tHome("features.feature1Title")}
                </h3>
              </div>
              <p className="text-sm sm:text-base tracking-[0.04em] sm:tracking-[0.1em] text-[hsl(var(--foreground))] font-normal leading-relaxed">
                {tHome("features.feature1Desc")}
              </p>
            </div>
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4">
              <Image
                src="/feature-ai-assistant.png"
                alt={tHome("imageAlt.aiAssistant")}
                width={800}
                height={600}
                className="w-full border-2 border-[hsl(var(--border-strong))]"
              />
            </div>
          </div>

          {/* Feature 2: Citations */}
          <div
            id="feature-citations"
            className="grid lg:grid-cols-2 gap-12 items-center mb-20 scroll-mt-24"
          >
            <div className="order-2 lg:order-1 border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4">
              <Image
                src="/feature-citations.png"
                alt="Akowe citation search and management interface"
                width={800}
                height={600}
                className="w-full border-2 border-[hsl(var(--border-strong))]"
              />
            </div>
            <div className="order-1 lg:order-2 space-y-5">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                  {tHome("features.feature2Label")}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.1em]">
                  {tHome("features.feature2Title")}
                </h3>
              </div>
              <p className="text-sm sm:text-base tracking-[0.04em] sm:tracking-[0.1em] text-[hsl(var(--foreground))] font-normal leading-relaxed">
                {tHome("features.feature2Desc")}
              </p>
              <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-3">
                <p className="text-xs uppercase tracking-[0.18em]">
                  {tHome("features.feature2Badge")}
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3: Plagiarism Check */}
          <div
            id="feature-plagiarism"
            className="grid lg:grid-cols-2 gap-12 items-center mb-20 scroll-mt-24"
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                  {tHome("features.feature3Label")}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.1em]">
                  {tHome("features.feature3Title")}
                </h3>
              </div>
              <p className="text-sm sm:text-base tracking-[0.04em] sm:tracking-[0.1em] text-[hsl(var(--foreground))] font-normal leading-relaxed">
                {tHome("features.feature3Desc")}
              </p>
            </div>
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4">
              <Image
                src="/feature-plagiarism-check.png"
                alt={tHome("imageAlt.plagiarismCheck")}
                width={800}
                height={600}
                className="w-full border-2 border-[hsl(var(--border-strong))]"
              />
            </div>
          </div>

          {/* Feature 4: Advisor / Peer Review */}
          <div
            id="feature-review"
            className="grid lg:grid-cols-2 gap-12 items-center mb-20 scroll-mt-24"
          >
            <div className="order-2 lg:order-1 border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 space-y-4">
              <div className="border-2 border-[hsl(var(--border-strong))] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[hsl(var(--muted-foreground))]">
                    Shared with Dr. Amara
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 border border-green-400 text-green-700">
                    Opened
                  </span>
                </div>
                <div className="h-px bg-[hsl(var(--border-strong))]" />
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-[10px] tracking-[0.08em]">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1 shrink-0" />
                    <p className="text-[hsl(var(--foreground))]">
                      <span className="font-semibold">
                        Literature Review §2
                      </span>{" "}
                      — &ldquo;The methodology section lacks a clear
                      justification for sample size. Can you add a power
                      analysis?&rdquo;
                    </p>
                  </div>
                  <div className="flex items-start gap-2 text-[10px] tracking-[0.08em]">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1 shrink-0" />
                    <p className="text-[hsl(var(--muted-foreground))]">
                      <span className="font-semibold">Introduction</span> —
                      Resolved
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-2 border-[hsl(var(--primary))]/30 bg-[hsl(var(--primary))]/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[hsl(var(--primary))]">
                  2 open comments · 1 resolved · Checklist 3/4 complete
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-5">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                  Advisor Review
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.1em]">
                  Get feedback without sending attachments
                </h3>
              </div>
              <p className="text-sm sm:text-base tracking-[0.04em] sm:tracking-[0.1em] text-[hsl(var(--foreground))] font-normal leading-relaxed">
                Share a private review link with your supervisor. They leave
                inline comments directly on your thesis sections — no login
                needed.
              </p>
              <ul className="space-y-2.5 text-xs uppercase tracking-[0.16em] text-[hsl(var(--foreground))]">
                <li className="flex items-center gap-3">
                  <Check size={15} className="text-[hsl(var(--primary))] flex-shrink-0" />
                  Inline comments anchored to specific text
                </li>
                <li className="flex items-center gap-3">
                  <Check size={15} className="text-[hsl(var(--primary))] flex-shrink-0" />
                  Custom review checklist per advisor
                </li>
                <li className="flex items-center gap-3">
                  <Check size={15} className="text-[hsl(var(--primary))] flex-shrink-0" />
                  Open / resolved comment tracking
                </li>
                <li className="flex items-center gap-3">
                  <Check size={15} className="text-[hsl(var(--primary))] flex-shrink-0" />
                  No advisor account required
                </li>
              </ul>
            </div>
          </div>

          {/* Ethical AI Trust Badge */}
          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-6">
            <h4 className="text-base font-semibold uppercase tracking-[0.18em] mb-4">
              {tHome("features.ethicalBadgeTitle")}
            </h4>
            <div className="grid sm:grid-cols-3 gap-3 text-xs sm:text-sm tracking-[0.06em]">
              <p className="font-normal italic" style={{ fontVariant: "small-caps" }}>{tHome("features.ethicalNoFabricated")}</p>
              <p className="font-normal italic" style={{ fontVariant: "small-caps" }}>{tHome("features.ethicalSupportsWriting")}</p>
              <p className="font-normal italic" style={{ fontVariant: "small-caps" }}>{tHome("features.ethicalBuiltForIntegrity")}</p>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section
          id="how-it-works"
          className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]"
        >
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]">
              {tHome("howItWorks.heading")}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-3">1</div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] mb-2">
                {tHome("howItWorks.step1Title")}
              </h3>
              <p className="text-xs tracking-[0.06em] text-[hsl(var(--muted-foreground))] leading-relaxed">
                {tHome("howItWorks.step1Desc")}
              </p>
            </div>
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-3">2</div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] mb-2">
                {tHome("howItWorks.step2Title")}
              </h3>
              <p className="text-xs tracking-[0.06em] text-[hsl(var(--muted-foreground))] leading-relaxed">
                {tHome("howItWorks.step2Desc")}
              </p>
            </div>
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-3">3</div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] mb-2">
                {tHome("howItWorks.step3Title")}
              </h3>
              <p className="text-xs tracking-[0.06em] text-[hsl(var(--muted-foreground))] leading-relaxed">
                {tHome("howItWorks.step3Desc")}
              </p>
            </div>
          </div>
        </section>

        {/* ── Designed for Academic Submission ── */}
        <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                  {tHome("academicAlignment.label")}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.1em]">
                  {tHome("trustB.heading")}
                </h2>
              </div>
              <ul className="space-y-3.5">
                {[
                  tHome("trustB.thesisFocused"),
                  tHome("trustB.citationFirst"),
                  tHome("trustB.submissionReady"),
                  tHome("whyChoose.importRefs"),
                  tHome("whyChoose.authorshipTrail"),
                  "Export submission-ready DOCX or PDF",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm tracking-[0.06em] sm:tracking-[0.12em]">
                    <Check
                      className="text-[hsl(var(--primary))] mt-0.5 flex-shrink-0"
                      size={18}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4">
              <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center space-y-1.5">
                <span className="text-4xl font-extrabold">
                  {tHome("stats.savings")}
                </span>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                  {tHome("stats.savingsDesc")}
                </p>
              </div>
              <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-6 text-center space-y-1.5 text-[hsl(var(--accent-foreground))]">
                <span className="text-4xl font-extrabold">
                  {tHome("stats.allInOne")}
                </span>
                <p className="text-[10px] uppercase tracking-[0.28em]">
                  {tHome("stats.allInOneDesc")}
                </p>
              </div>
              <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 text-center space-y-1.5">
                <span className="text-4xl font-extrabold">
                  {tHome("stats.tenHours")}
                </span>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                  {tHome("stats.tenHoursDesc")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Pricing ── */}
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

          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 md:p-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
                  "px-3 py-2 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[10px] font-semibold uppercase tracking-[0.28em] text-[hsl(var(--accent-foreground))] transition-all duration-200 text-center",
                  isAnnual
                    ? "opacity-100 visible"
                    : "opacity-0 invisible w-0 px-0 border-0 overflow-hidden"
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

          <div className="grid gap-8 md:gap-6 md:grid-cols-3">
            {/* Free Plan */}
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-5 md:p-8 flex flex-col gap-6">
              <div className="space-y-2">
                <span className="text-xs tracking-[0.06em] text-[hsl(var(--muted-foreground))]" style={{ fontVariant: "small-caps" }}>
                  {tHome("plans.freePlanLabel")}
                </span>
                <span className="text-4xl md:text-5xl font-bold">
                  {tHome("plans.freePlanPrice")}
                </span>
                <p className="text-[10px] tracking-[0.06em] text-[hsl(var(--muted-foreground))]" style={{ fontVariant: "small-caps" }}>
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
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.freePlanTopicFinder")}
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

            {/* Standard Plan — recommended */}
            <div className="relative border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-5 md:p-8 pt-8 md:pt-8 flex flex-col gap-6">
              <span className="absolute -top-4 left-4 px-3 py-1 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-[10px] font-semibold uppercase tracking-[0.3em] text-[hsl(var(--foreground))]">
                {tHome("plans.standardPlanBadge")}
              </span>
              <div className="space-y-2">
                <span className="text-xs tracking-[0.06em]" style={{ fontVariant: "small-caps" }}>
                  {tHome("plans.standardPlanLabel")}
                </span>
                <span className="text-4xl md:text-5xl font-bold">
                  {isAnnual
                    ? tHome("plans.standardPlanPriceAnnual")
                    : tHome("plans.standardPlanPriceMonthly")}
                </span>
                <p className="text-[10px] uppercase tracking-[0.28em]">
                  {isAnnual
                    ? tHome("plans.standardPlanBilledAnnual")
                    : tHome("plans.standardPlanBilledMonthly")}
                </p>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--foreground))] min-h-[14px]">
                  {isAnnual ? (
                    tHome("plans.standardPlanEquivalent")
                  ) : (
                    <span className="font-semibold">
                      {tHome("plans.standardPlanFirstMonthOff")}
                    </span>
                  )}
                </p>
              </div>
              <ul className="space-y-3 text-xs uppercase tracking-[0.24em]">
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.standardPlan2000Words")}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.standardPlan5Checks")}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.standardPlan10Projects")}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.standardPlanGPT4")}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.standardPlan10Rewrites")}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.standardPlanTopicFinder")}
                </li>
              </ul>
              <Link href="/auth/signin">
                <Button className="w-full py-4">
                  {tHome("plans.standardPlanCta")}
                </Button>
              </Link>
              <p className="text-[10px] tracking-[0.06em] text-center" style={{ fontVariant: "small-caps" }}>
                {tHome("plans.standardPlanTagline")}
              </p>
            </div>

            {/* Pro Plan */}
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-5 md:p-8 flex flex-col gap-6">
              <div className="space-y-2">
                <span className="text-xs tracking-[0.06em] text-[hsl(var(--muted-foreground))]" style={{ fontVariant: "small-caps" }}>
                  {tHome("plans.proPlanLabel")}
                </span>
                <span className="text-4xl md:text-5xl font-bold">
                  {isAnnual
                    ? tHome("plans.proPlanPriceAnnual")
                    : tHome("plans.proPlanPriceMonthly")}
                </span>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                  {isAnnual
                    ? tHome("plans.proPlanBilledAnnual")
                    : tHome("plans.proPlanBilledMonthly")}
                </p>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] min-h-[14px]">
                  {isAnnual ? (
                    tHome("plans.proPlanEquivalent")
                  ) : (
                    <span className="font-semibold">
                      {tHome("plans.proPlanFirstMonthOff")}
                    </span>
                  )}
                </p>
              </div>
              <ul className="space-y-3 text-xs uppercase tracking-[0.24em] text-[hsl(var(--foreground))]">
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
                  {tHome("plans.proPlanTopicFinder")}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} />
                  {tHome("plans.proPlanPrioritySupport")}
                </li>
              </ul>
              <Link href="/auth/signin">
                <Button variant="outline" className="w-full py-4">
                  {tHome("plans.proPlanCta")}
                </Button>
              </Link>
              <p className="text-[10px] tracking-[0.06em] text-center text-[hsl(var(--muted-foreground))]" style={{ fontVariant: "small-caps" }}>
                {tHome("plans.proPlanTagline")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]">
              {tHome("faq.title")}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] mb-3">
                {tHome("faq.whoUses")}
              </h3>
              <p className="text-sm tracking-[0.04em] text-[hsl(var(--muted-foreground))] leading-relaxed">
                {tHome("faq.whoUsesAnswer")}
              </p>
            </div>
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] mb-3">
                {tHome("faq.citationsIncluded")}
              </h3>
              <p className="text-sm tracking-[0.04em] text-[hsl(var(--muted-foreground))] leading-relaxed">
                {tHome("faq.citationsIncludedAnswer")}
              </p>
            </div>
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] mb-3">
                {tHome("faq.doesInvent")}
              </h3>
              <p className="text-sm tracking-[0.04em] text-[hsl(var(--muted-foreground))] leading-relaxed">
                {tHome("faq.doesInventAnswer")}
              </p>
            </div>
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] mb-3">
                {tHome("faq.similarityChecked")}
              </h3>
              <p className="text-sm tracking-[0.04em] text-[hsl(var(--muted-foreground))] leading-relaxed">
                {tHome("faq.similarityCheckedAnswer")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
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
                Start Your Thesis Free
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            {tHome("finalCta.controlSub")}
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
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
          <nav className="flex flex-wrap gap-4 sm:gap-6 text-xs uppercase tracking-[0.28em]">
            <Link
              href="/pricing"
              className="hover:text-[hsl(var(--secondary))] transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/tools/plagiarism-check"
              className="hover:text-[hsl(var(--secondary))] transition-colors"
            >
              Plagiarism Check
            </Link>
            <Link
              href="/tools/reference-checker"
              className="hover:text-[hsl(var(--secondary))] transition-colors"
            >
              Reference Checker
            </Link>
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
            &copy; {new Date().getFullYear()} {tHome("footer.brand")}.{" "}
            {tHome("footer.copyright")}
          </p>
        </div>
      </footer>

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
