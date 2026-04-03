'use client';

import { useEffect, useState } from 'react';
import { X, Check, Zap, Crown } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Context message explaining why the user hit a limit */
  reason?: string;
  /** Which plan to highlight — defaults to 'standard' for first-time nudges */
  suggestedPlan?: 'standard' | 'pro';
}

const PLAN_META = [
  {
    type: 'standard' as const,
    name: 'Standard',
    monthlyPrice: '$7',
    annualPrice: '$70',
    annualEquiv: '$5.83/mo',
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    type: 'pro' as const,
    name: 'Pro',
    monthlyPrice: '$12',
    annualPrice: '$120',
    annualEquiv: '$10/mo',
    icon: Crown,
    color: 'from-indigo-500 to-purple-500',
  },
];

export default function UpgradeModal({
  isOpen,
  onClose,
  reason,
  suggestedPlan = 'standard',
}: UpgradeModalProps) {
  const router = useRouter();
  const t = useTranslations('components.upgradeModal');
  const [isAnnual, setIsAnnual] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState<'standard' | 'pro' | null>(null);
  const CHECKOUT_REDIRECT_FLAG = 'akowe_checkout_redirecting';
  const CHECKOUT_REDIRECT_FLAG_FALLBACK = 'akowe_checkout_redirecting_ls';

  useEffect(() => {
    const resetUpgrading = () => setIsUpgrading(null);
    const clearCheckoutRedirect = () => {
      sessionStorage.removeItem(CHECKOUT_REDIRECT_FLAG);
      localStorage.removeItem(CHECKOUT_REDIRECT_FLAG_FALLBACK);
    };
    const hasCheckoutRedirectMark = () =>
      sessionStorage.getItem(CHECKOUT_REDIRECT_FLAG) === '1' ||
      localStorage.getItem(CHECKOUT_REDIRECT_FLAG_FALLBACK) === '1';

    const handlePageShow = (event: PageTransitionEvent) => {
      const fromCheckoutRedirect = hasCheckoutRedirectMark();
      if (fromCheckoutRedirect) {
        clearCheckoutRedirect();
      }

      if (event.persisted) {
        resetUpgrading();
        if (fromCheckoutRedirect) {
          window.location.reload();
          return;
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetUpgrading();
      }
    };

    const handleWindowFocus = () => {
      resetUpgrading();
    };

    const handlePageHide = () => {
      resetUpgrading();
    };

    if (hasCheckoutRedirectMark()) {
      clearCheckoutRedirect();
      resetUpgrading();
    }

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const PLANS = PLAN_META.map((plan) => ({
    ...plan,
    features: [1, 2, 3, 4, 5, 6, 7].map((i) => t(`${plan.type}.feature${i}` as Parameters<typeof t>[0])),
  }));

  if (!isOpen) return null;

  const handleUpgrade = async (planType: 'standard' | 'pro') => {
    setIsUpgrading(planType);
    try {
      const billingCycle = isAnnual ? 'annual' : 'monthly';
      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle, planType }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          sessionStorage.setItem(CHECKOUT_REDIRECT_FLAG, '1');
          localStorage.setItem(CHECKOUT_REDIRECT_FLAG_FALLBACK, '1');
          setIsUpgrading(null);
          window.location.href = data.url;
          return;
        }
      }
    } catch {
      // fall through
    }
    sessionStorage.removeItem(CHECKOUT_REDIRECT_FLAG);
    localStorage.removeItem(CHECKOUT_REDIRECT_FLAG_FALLBACK);
    setIsUpgrading(null);
    router.push('/settings');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-[hsl(var(--surface))] border-4 border-[hsl(var(--border-strong))] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[8px_8px_0_rgba(29,41,57,0.18)]">
        {/* Header */}
        <div className="flex items-start justify-between p-4 md:p-6 border-b-4 border-[hsl(var(--border-strong))]">
          <div>
            <span className="text-[10px] uppercase tracking-[0.36em] text-[hsl(var(--muted-foreground))]">
              {t('label')}
            </span>
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-[0.12em] mt-1">
              {reason ? t('titleLimit') : t('titleChoose')}
            </h2>
            {reason && (
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 uppercase tracking-[0.12em]">
                {reason}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[hsl(var(--surface-muted))] border-2 border-transparent hover:border-[hsl(var(--border-strong))] cursor-pointer"
            aria-label={t('close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 py-4 border-b-2 border-[hsl(var(--border))]">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-2 border-2 border-[hsl(var(--border-strong))] text-xs font-semibold uppercase tracking-[0.24em] transition-transform duration-150 cursor-pointer ${
              !isAnnual
                ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] -translate-x-0.5 -translate-y-0.5'
                : 'bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))]'
            }`}
          >
            {t('monthly')}
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-2 border-2 border-[hsl(var(--border-strong))] text-xs font-semibold uppercase tracking-[0.24em] transition-transform duration-150 cursor-pointer ${
              isAnnual
                ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] -translate-x-0.5 -translate-y-0.5'
                : 'bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))]'
            }`}
          >
            {t('annual')}
          </button>
          {isAnnual && (
            <span className="px-3 py-1.5 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[10px] font-semibold uppercase tracking-[0.28em] text-[hsl(var(--accent-foreground))]">
              {t('savePercent')}
            </span>
          )}
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-2 gap-0 divide-y-4 md:divide-y-0 md:divide-x-4 divide-[hsl(var(--border-strong))]">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isHighlighted = plan.type === suggestedPlan;
            return (
              <div
                key={plan.type}
                className={`p-4 md:p-6 flex flex-col gap-4 ${isHighlighted ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]' : ''}`}
              >
                {isHighlighted && (
                  <span className="text-[10px] uppercase tracking-[0.32em] font-semibold">
                    {t('recommended')}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center bg-gradient-to-br ${plan.color} text-white`}>
                    <Icon size={18} />
                  </span>
                  <span className="text-xl font-bold uppercase tracking-[0.16em]">{plan.name}</span>
                </div>

                <div>
                  <span className="text-3xl md:text-4xl font-bold">
                    {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-sm text-[hsl(var(--muted-foreground))] ml-1">
                    /{isAnnual ? t('perYear') : t('perMonth')}
                  </span>
                  {isAnnual && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                      ≈ {plan.annualEquiv}
                    </p>
                  )}
                </div>

                <ul className="space-y-2 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs uppercase tracking-[0.16em]">
                      <Check size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.type)}
                  disabled={!!isUpgrading}
                  className={`w-full py-3 border-2 border-[hsl(var(--border-strong))] text-xs font-semibold uppercase tracking-[0.24em] transition-transform duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
                    isHighlighted
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:-translate-x-0.5 hover:-translate-y-0.5'
                      : 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] hover:-translate-x-0.5 hover:-translate-y-0.5'
                  }`}
                >
                  {isUpgrading === plan.type ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                      {t('processing')}
                    </span>
                  ) : (
                    t('upgradeTo', { plan: plan.name })
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t-2 border-[hsl(var(--border))] text-center space-y-1">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
            Join 500+ researchers writing with Akowe Pro
          </p>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
            {t('footer')}
          </p>
        </div>
      </div>
    </div>
  );
}
