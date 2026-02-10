'use client';

import Link from 'next/link';
import { BookOpen, Heart, Lightbulb, Users, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="sticky top-0 z-50 border-b-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-[var(--radius)] shadow-[4px_4px_0_rgba(29,41,57,0.12)]">
                <ArrowLeft size={18} />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs uppercase tracking-[0.36em] text-[hsl(var(--muted-foreground))]">
                  Back to
                </span>
                <span className="text-xl font-bold uppercase tracking-[0.16em]">
                  Research Studio
                </span>
              </div>
            </Link>
            <nav className="flex items-center gap-6 text-xs font-semibold uppercase tracking-[0.28em]">
              <a
                href="https://blog.useakowe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[hsl(var(--secondary))] transition-colors"
              >
                Blog
              </a>
              <Link href="/auth/signin" className="hover:text-[hsl(var(--secondary))] transition-colors">
                Sign In
              </Link>
            
            </nav>
          </div>
        </div>
      </header>

      <main className="px-6 sm:px-8 lg:px-12">
        {/* Hero */}
        <section className="max-w-7xl mx-auto py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-12 items-start">
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                Behind the name
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold uppercase tracking-[0.06em] sm:tracking-[0.1em] lg:tracking-[0.12em] leading-tight">
                The Story of Akọ̀wé
              </h1>
              <p className="text-sm md:text-base uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] max-w-xl">
                Yoruba heritage meets disciplined abstraction. We build tools that honor scholarship, clarity, and cultural memory.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth/signin">
                  <Button className="px-8 py-4 flex items-center gap-3">
                    Start Writing
                  </Button>
                </Link>
                <a
                  href="https://blog.useakowe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="px-8 py-4">
                    Explore Blog
                  </Button>
                </a>
              </div>
            </div>
            <Card className="lg:col-span-5 p-8 space-y-4 bg-[hsl(var(--surface))]">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                <BookOpen size={18} />
                Yoruba translation
              </div>
              <p className="text-2xl font-semibold uppercase tracking-[0.08em] leading-snug">
                Akọ̀wé (ah-koh-weh) — the educated one, the scholar, the scribe.
              </p>
              <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                A keeper of knowledge tasked with preserving truth for their community.
              </p>
            </Card>
          </div>
        </section>

        {/* Name narrative */}
        <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="sticky top-28 space-y-6">
                <Heart className="w-12 h-12 text-[hsl(var(--secondary))]" />
                <h2 className="text-3xl font-bold uppercase tracking-[0.12em] leading-snug">
                  Why the name matters
                </h2>
                <p className="text-xs uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
                  Rooted in heritage, designed for modern scholarship.
                </p>
              </div>
            </div>
            <div className="lg:col-span-8 space-y-6 text-xs sm:text-sm uppercase tracking-[0.16em] sm:tracking-[0.18em] leading-6 sm:leading-8">
              <p>
                In Yoruba societies, an <em>Akọ̀wé</em> held a sacred responsibility. They interpreted oral
                histories, codified agreements, and ensured knowledge survived beyond memory.
              </p>
              <p>
                They were rigorous, meticulous, and deeply trusted. Not because they loved paperwork, but
                because preserving truth kept the community intact.
              </p>
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] p-6">
                <p className="text-xs sm:text-sm uppercase tracking-[0.18em] sm:tracking-[0.22em] leading-relaxed">
                  &ldquo;Choosing Akọ̀wé anchors our work in a legacy of integrity. The studio isn&apos;t
                  just software—it is a continuation of that covenant with accuracy and care.&rdquo;
                </p>
              </div>
              <p>
                Our design system mirrors that discipline. Strong outlines, deliberate blocks of color,
                and measured grids echo the structured pages of archival ledgers.
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                  Our mission
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-[0.08em] sm:tracking-[0.1em] lg:tracking-[0.12em] leading-tight">
                  Equip scholars to deliver work that holds up under scrutiny.
                </h2>
              </div>
              <p className="text-xs uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))] max-w-xl">
                Every interaction—drafting, citing, reviewing—should reinforce academic rigor and celebrate cultural intelligence.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <Card hover className="p-6 space-y-4 bg-[hsl(var(--surface))]">
                <div className="w-12 h-12 border-[3px] border-[hsl(var(--border-strong))] rounded-[var(--radius)] flex items-center justify-center text-[hsl(var(--foreground))]">
                  <Lightbulb size={22} />
                </div>
                <h3 className="text-lg font-semibold uppercase tracking-[0.18em]">
                  Empower excellence
                </h3>
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] leading-relaxed">
                  Provide structure that keeps arguments coherent, citations complete, and ideas publish-ready.
                </p>
              </Card>
              <Card hover className="p-6 space-y-4 bg-[hsl(var(--surface))]">
                <div className="w-12 h-12 border-[3px] border-[hsl(var(--border-strong))] rounded-[var(--radius)] flex items-center justify-center text-[hsl(var(--foreground))]">
                  <BookOpen size={22} />
                </div>
                <h3 className="text-lg font-semibold uppercase tracking-[0.18em]">
                  Preserve integrity
                </h3>
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] leading-relaxed">
                  Guard against sloppy sourcing. Surface trustworthy references. Encourage attribution by design.
                </p>
              </Card>
              <Card hover className="p-6 space-y-4 bg-[hsl(var(--surface))]">
                <div className="w-12 h-12 border-[3px] border-[hsl(var(--border-strong))] rounded-[var(--radius)] flex items-center justify-center text-[hsl(var(--foreground))]">
                  <Users size={22} />
                </div>
                <h3 className="text-lg font-semibold uppercase tracking-[0.18em]">
                  Democratize knowledge
                </h3>
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] leading-relaxed">
                  Deliver premium workflow tooling at accessible price points for students, labs, and independent scholars.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Founders story */}
        <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                Founder&apos;s drive
              </span>
              <h2 className="mt-3 text-3xl font-bold uppercase tracking-[0.12em] leading-tight">
                Built from lived academic frustrations.
              </h2>
            </div>
            <Card className="lg:col-span-8 p-8 space-y-6 bg-[hsl(var(--surface))]">
              <p className="text-xs sm:text-sm uppercase tracking-[0.18em] sm:tracking-[0.2em] leading-relaxed">
                Akọ̀wé began when our team—graduate researchers balancing teaching gigs and grant deadlines—grew tired of stitching together six tools to finish one paper.
              </p>
              <p className="text-xs sm:text-sm uppercase tracking-[0.18em] sm:tracking-[0.2em] leading-relaxed">
                Citation managers missed context. Plagiarism scanners lived behind paywalls. Drafting assistants ignored academic tone. None of it spoke to the pressures of producing defensible research.
              </p>
              <div className="border-[3px] border-[hsl(var(--border-strong))] p-6 bg-[hsl(var(--surface-muted))] space-y-2">
                <p className="text-xs uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
                  We asked:
                </p>
                <p className="text-sm uppercase tracking-[0.2em] leading-relaxed">
                  What if a single studio could draft, cite, check originality, and export with discipline? What if it respected cultural lenses and modern research realities alike?
                </p>
              </div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.18em] sm:tracking-[0.2em] leading-relaxed">
                Today we remain self-funded by the scholars who rely on Akọ̀wé. That keeps our priorities aligned with classrooms, labs, and libraries—not venture timelines.
              </p>
              <p className="text-xs sm:text-sm uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[hsl(var(--secondary))] text-center">
                Integrity over hype. Craft over noise. Scholarship that endures.
              </p>
            </Card>
          </div>
        </section>

        {/* Values */}
        <section className="max-w-7xl mx-auto py-16 border-t-[4px] border-[hsl(var(--border-strong))]">
          <div className="space-y-10">
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                Core values
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-[0.08em] sm:tracking-[0.1em] lg:tracking-[0.12em] leading-tight">
                The principles that shape every release.
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  title: 'Excellence without compromise',
                  body: 'Every component ships with documentation, accessibility checks, and an eye for peer review.'
                },
                {
                  title: 'Accessibility first',
                  body: 'A useful free tier and fair pricing keep high-caliber tooling within reach for under-resourced scholars.'
                },
                {
                  title: 'Community-led evolution',
                  body: 'We prioritize roadmap items that unblock classrooms, labs, and writing centers.'
                },
                {
                  title: 'Cultural stewardship',
                  body: 'Design choices echo the archival rigor and artistic lineage that inspired Akọ̀wé.'
                }
              ].map((value, index) => (
                <Card key={value.title} className="p-6 bg-[hsl(var(--surface))] space-y-3 border-[4px] border-[hsl(var(--border-strong))]">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-xl font-semibold uppercase tracking-[0.16em]">{value.title}</h3>
                  <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] leading-relaxed">
                    {value.body}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto py-20 border-t-[4px] border-[hsl(var(--border-strong))]">
          <Card className="p-10 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border-[4px] border-[hsl(var(--border-strong))] space-y-6 text-center">
            <span className="text-xs uppercase tracking-[0.32em]">Join the studio</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-[0.08em] sm:tracking-[0.1em] lg:tracking-[0.12em] leading-tight">
              Ready to publish work that withstands scrutiny?
            </h2>
            <p className="text-xs uppercase tracking-[0.22em] max-w-2xl mx-auto">
              Thousands of writers, researchers, and advisors rely on Akọ̀wé to stay organized, cite responsibly, and present rigor with confidence.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link href="/auth/signin">
                <Button className="px-10 py-4 text-sm uppercase tracking-[0.2em]">
                  Start Writing Free
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="px-10 py-4 text-sm uppercase tracking-[0.2em]">
                  Tour the workspace
                </Button>
              </Link>
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em]">
              No credit card required • Upgrade when you need more power
            </p>
          </Card>
        </section>
      </main>

      <footer className="border-t-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between text-[hsl(var(--foreground))]">
          <div>
            <h4 className="text-xl font-semibold uppercase tracking-[0.16em]">Akọ̀wé</h4>
            <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
              Built for scholars, by scholars.
            </p>
          </div>
          <nav className="flex gap-6 text-xs uppercase tracking-[0.28em]">
            <Link href="/about" className="hover:text-[hsl(var(--secondary))] transition-colors">
              Our Story
            </Link>
            <a
              href="https://blog.useakowe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[hsl(var(--secondary))] transition-colors"
            >
              Blog
            </a>
            <Link href="/auth/signin" className="hover:text-[hsl(var(--secondary))] transition-colors">
              Sign In
            </Link>
          </nav>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
            © {new Date().getFullYear()} Akọ̀wé. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

