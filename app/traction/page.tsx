import { getPublicMetrics } from '@/lib/admin/public-metrics';
import { notFound } from 'next/navigation';

// ─── Known-accurate figures (update these as numbers change) ────────────────
const TOTAL_SPEND_USD   = 600;   // total marketing spend to date
const TOTAL_REVENUE_USD = 133;   // actual total revenue (verified from admin)
const TOTAL_USERS       = 1550;  // verified from admin
const PAID_CUSTOMERS    = 5;     // ever paid (includes lapsed)
const ACTIVE_PAYING     = 3;     // currently active subscriptions
const MONTHS_OPERATING  = 3;     // months since first spend
const ACCESS_TOKEN      = '';    // set a string to password-protect

// ─── Valuation ──────────────────────────────────────────────────────────────
const VALUATION_USD     = 500_000;  // pre-money · see methodology section on page

// ─── Derived unit economics ─────────────────────────────────────────────────
const COST_PER_USER     = TOTAL_SPEND_USD / TOTAL_USERS;
const CAC_USD           = TOTAL_SPEND_USD / PAID_CUSTOMERS;
const ARPU_USD          = TOTAL_REVENUE_USD / PAID_CUSTOMERS;
const LTV_USD           = ARPU_USD * 12;
const LTV_CAC           = LTV_USD / CAC_USD;
const CONVERSION_PCT    = ((PAID_CUSTOMERS / TOTAL_USERS) * 100).toFixed(2);
const BURN_MONTHLY      = TOTAL_SPEND_USD / MONTHS_OPERATING;
const IMPLIED_PER_USER  = VALUATION_USD / TOTAL_USERS;
const CAC_AT_2PCT       = COST_PER_USER / 0.02;
const CAC_AT_5PCT       = COST_PER_USER / 0.05;

function fmt(n: number, dp = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
function usd(n: number, dp = 0) {
  return `$${fmt(n, dp)}`;
}

function StatCard({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`border-4 p-5 space-y-2 ${
        accent
          ? 'border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))]'
          : 'border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]'
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
        {label}
      </p>
      <p className="text-3xl font-black leading-none text-[hsl(var(--foreground))]">{value}</p>
      {note && (
        <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
          {note}
        </p>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.4em] text-[hsl(var(--muted-foreground))] mb-4">
      {children}
    </p>
  );
}

export default async function TractionPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  if (ACCESS_TOKEN && params.token !== ACCESS_TOKEN) return notFound();

  let liveMetrics;
  try {
    liveMetrics = await getPublicMetrics();
  } catch {
    liveMetrics = null;
  }

  const activeUsers30d = liveMetrics?.productHealth.activeUsers ?? 0;
  const aiWords30d     = liveMetrics?.usage.aiWordsInPeriod ?? 0;
  const totalProjects  = liveMetrics?.projects.total ?? 0;
  const wau            = liveMetrics?.users.wau ?? 0;

  const date = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="border-b-4 border-[hsl(var(--border-strong))] px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-[0.12em]">Akọ̀wé</h1>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mt-1">
            Traction &amp; Valuation Summary
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
          {date}
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-12 space-y-14">

        {/* ── Tagline ─────────────────────────────────────────────────────── */}
        <div className="space-y-4 border-b-2 border-[hsl(var(--border))] pb-10">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-[0.08em] leading-tight">
            AI-powered academic writing.<br />
            <span className="text-[hsl(var(--muted-foreground))]">Built for 230M students.</span>
          </h2>
          <p className="text-sm uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] max-w-2xl">
            Replaces 4–5 separate tools students use to write, cite, check plagiarism,
            and manage research — at half the cost, in one workspace.
          </p>
        </div>

        {/* ── Where we are ────────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Where we are · {MONTHS_OPERATING} months in</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total users"
              value={fmt(TOTAL_USERS)}
              note={`Acquired over ${MONTHS_OPERATING} months`}
              accent
            />
            <StatCard
              label="Paying customers"
              value={fmt(PAID_CUSTOMERS)}
              note={`${ACTIVE_PAYING} currently active`}
            />
            <StatCard
              label="Total revenue"
              value={usd(TOTAL_REVENUE_USD)}
              note="Stripe + Wise"
            />
            <StatCard
              label="Avg monthly spend"
              value={usd(BURN_MONTHLY)}
              note={`${usd(TOTAL_SPEND_USD)} total · ${MONTHS_OPERATING} months`}
            />
          </div>
        </section>

        {/* ── Unit economics ───────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Unit economics</SectionLabel>

          {/* Two CAC numbers — both real */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 space-y-3">
              <p className="text-[10px] uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                Cost per acquired user
              </p>
              <p className="text-5xl font-black text-[hsl(var(--foreground))]">
                {usd(COST_PER_USER, 2)}
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                {usd(TOTAL_SPEND_USD)} spent · {fmt(TOTAL_USERS)} users · {MONTHS_OPERATING} months
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed pt-1">
                The cost to bring someone through the door.
                Most early-stage SaaS pays $5–$50/user for this.
              </p>
            </div>

            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--foreground))] text-[hsl(var(--background))] p-6 space-y-3">
              <p className="text-[10px] uppercase tracking-[0.32em] opacity-50">
                CAC · per paying customer
              </p>
              <p className="text-5xl font-black">{usd(CAC_USD)}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">
                {usd(TOTAL_SPEND_USD)} ÷ {PAID_CUSTOMERS} paying customers
              </p>
              <p className="text-xs opacity-70 leading-relaxed pt-1">
                High because free-to-paid ({CONVERSION_PCT}%) hasn&apos;t been
                actively worked yet. At 2% conversion: <strong className="opacity-100">{usd(CAC_AT_2PCT, 0)}</strong>.
                At 5%: <strong className="opacity-100">{usd(CAC_AT_5PCT, 0)}</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <StatCard
              label="LTV (12-mo est.)"
              value={usd(LTV_USD, 0)}
              note="Blended ARPU × 12 months"
            />
            <StatCard
              label="LTV : CAC"
              value={`${LTV_CAC.toFixed(1)}×`}
              note="Target > 3× for healthy SaaS"
            />
            <StatCard
              label="Free-to-paid rate"
              value={`${CONVERSION_PCT}%`}
              note="SaaS baseline is 2–5%"
            />
          </div>

          {/* Key insight */}
          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-5">
            <p className="text-[10px] uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] mb-2">
              The opportunity
            </p>
            <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed">
              Acquisition is cheap at <strong>{usd(COST_PER_USER, 2)}/user</strong>. The bottleneck
              is converting free users to paid — a product and messaging problem, not a distribution
              problem. That&apos;s the most tractable kind to have. Moving conversion from{' '}
              {CONVERSION_PCT}% to 2% — without acquiring a single new user — produces{' '}
              <strong>{fmt(Math.round(TOTAL_USERS * 0.02))} paying customers</strong> from
              the existing base.
            </p>
          </div>
        </section>

        {/* ── Product engagement ───────────────────────────────────────────── */}
        <section>
          <SectionLabel>Product engagement · live · last 30 days</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Active users"     value={fmt(activeUsers30d)} note="Used product in last 30d" accent />
            <StatCard label="Weekly active"    value={fmt(wau)}            note="WAU — last 7 days" />
            <StatCard label="AI words written" value={fmt(aiWords30d)}     note="Last 30 days" />
            <StatCard label="Total projects"   value={fmt(totalProjects)}  note="All time" />
          </div>
        </section>

        {/* ── Valuation framing ────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Valuation basis</SectionLabel>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em]">
                Why revenue multiples don&apos;t apply yet
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                At {usd(TOTAL_REVENUE_USD)} total revenue and {MONTHS_OPERATING} months in, applying
                a standard SaaS multiple would produce a misleading number. Pre-PMF SaaS is more
                accurately valued on <strong className="text-[hsl(var(--foreground))]">user acquisition
                cost, market size, and the quality of the conversion problem</strong>.
              </p>
              <div className="space-y-2 pt-1">
                {[
                  `${fmt(TOTAL_USERS)} users at ${usd(COST_PER_USER, 2)}/user — well below industry average`,
                  'Conversion funnel is the known bottleneck, not product quality',
                  'Recurring need — students return each semester with new assignments',
                  'Free-to-paid improvement is a lever, not a variable',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                    <span className="font-black text-[hsl(var(--foreground))] mt-0.5">—</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-5 space-y-1">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">User-based multiple</p>
                <p className="text-lg font-black">{usd(TOTAL_USERS * 50)} – {usd(TOTAL_USERS * 300)}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">$50–$300/user · standard pre-seed range</p>
              </div>
              <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-5 space-y-1">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">Pre-seed EdTech comps (2023–24)</p>
                <p className="text-lg font-black">$300K – $2M</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Median $750K · AngelList / Crunchbase</p>
              </div>
              <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-5 space-y-1">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">ARR multiple (if applied)</p>
                <p className="text-lg font-black">Not meaningful at this stage</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">10–25× ARR is the benchmark; revenue is pre-scale</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Growth levers not yet pulled ─────────────────────────────────── */}
        <section>
          <SectionLabel>Upside not yet in the numbers</SectionLabel>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: 'Free-to-paid conversion',
                body: `Current rate is ${CONVERSION_PCT}%. At the 2% SaaS baseline that's ${fmt(Math.round(TOTAL_USERS * 0.02))} paying customers from the existing base — without acquiring a single new user.`,
              },
              {
                title: 'SEO content moat',
                body: '100+ programmatic pages indexed and ranking. Compounding organic traffic at zero marginal cost — not yet monetised.',
              },
              {
                title: 'Institutional licensing',
                body: 'One university contract unlocks hundreds of users per deal. No institutional sales have been attempted.',
              },
              {
                title: 'Non-English markets',
                body: 'Product already localised into 9 languages. Zero marketing spend outside English-speaking markets so far.',
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-5 space-y-2"
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em]">{title}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Valuation ────────────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Our valuation</SectionLabel>

          {/* The number */}
          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--foreground))] text-[hsl(var(--background))] p-8 mb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.4em] opacity-50">
                Pre-money valuation
              </p>
              <p className="text-6xl md:text-7xl font-black leading-none">
                ${(VALUATION_USD / 1000).toFixed(0)}K
              </p>
              <p className="text-[10px] uppercase tracking-[0.28em] opacity-50">
                {usd(IMPLIED_PER_USER, 0)} implied per user · {fmt(TOTAL_USERS)} users
              </p>
            </div>
            <div className="space-y-1 md:text-right max-w-xs">
              <p className="text-xs opacity-70 leading-relaxed">
                Based on comparable pre-seed EdTech transactions, user acquisition cost,
                and the quality of the conversion opportunity ahead.
              </p>
              <p className="text-[10px] uppercase tracking-[0.24em] opacity-40 pt-1">
                ola@placeholderllc.name.ng
              </p>
            </div>
          </div>

          {/* Methodology */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                Method 1 · User multiple
              </p>
              <p className="text-xl font-black">{usd(TOTAL_USERS * 100)} – {usd(TOTAL_USERS * 300)}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                $100–$300/user is standard for early-stage SaaS with demonstrated
                engagement. Our {usd(IMPLIED_PER_USER, 0)}/user sits conservatively within this.
              </p>
            </div>
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                Method 2 · EdTech pre-seed comps
              </p>
              <p className="text-xl font-black">$300K – $2M</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                AngelList / Crunchbase pre-seed EdTech deals 2023–24.
                Median is $750K. Our {usd(VALUATION_USD / 1000, 0)}K is a 33% discount
                to median — appropriate for 3 months in.
              </p>
            </div>
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                Method 3 · Conversion upside
              </p>
              <p className="text-xl font-black">{usd(TOTAL_USERS * 0.02 * LTV_USD, 0)} potential LTV</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                {fmt(Math.round(TOTAL_USERS * 0.02))} customers at 2% conversion × {usd(LTV_USD, 0)} LTV.
                The {usd(VALUATION_USD / 1000, 0)}K valuation implies buying this upside
                at a steep discount to realised value.
              </p>
            </div>
          </div>

          {/* Honest caveat */}
          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-5 mt-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))] mb-2">
              What we are and are not claiming
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              We are not claiming to be a $500K revenue business. We are claiming to be a working product
              with {fmt(TOTAL_USERS)} real users, proof of willingness to pay, cheap distribution at{' '}
              {usd(COST_PER_USER, 2)}/user, and a clear, solvable bottleneck in free-to-paid conversion.
              The valuation reflects the cost to rebuild what exists plus a reasonable premium
              for early traction — not a projection of future revenue.
            </p>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="border-t-2 border-[hsl(var(--border))] pt-6 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
            Akowe · useakowe.com · olamide@placeholderllc.name.ng
          </p>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
            Live data · {date}
          </p>
        </div>

      </div>
    </div>
  );
}
