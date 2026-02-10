'use client';

import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { X, Gift, ArrowRight, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface Active37DiscountPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  activeDays?: number;
}

/**
 * Popup component to show ACTIVE37 discount offer to active users
 * Designed to fit Akowe's branding and design system
 */
export default function Active37DiscountPopup({
  isOpen,
  onClose,
  onUpgrade,
  activeDays = 0,
}: Active37DiscountPopupProps) {
  const router = useRouter();
  const t = useTranslations('components.active37Popup');

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onUpgrade();
    onClose();
    router.push('/settings');
  };

  return (
    <div className="fixed inset-0 bg-[hsl(var(--foreground))]/90 z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-4 border-[hsl(var(--primary))] bg-[hsl(var(--surface))] p-6 md:p-8 space-y-6 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-[hsl(var(--surface-muted))] rounded-(--radius) transition-colors"
          aria-label={t('close')}
        >
          <X size={20} />
        </button>

        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 border-4 border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 rounded-full flex items-center justify-center">
              <Gift className="text-[hsl(var(--primary))]" size={32} />
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-[0.12em] mb-2">
              {t('title')}
            </h2>
            <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
              {t('activeMessage', {
                days: activeDays,
                daysLabel: activeDays === 1 ? t('day') : t('days'),
              })}
            </p>
          </div>

          <div className="border-[3px] border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 p-4 rounded-(--radius)">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="text-[hsl(var(--primary))]" size={20} />
              <span className="text-3xl font-black text-[hsl(var(--primary))]">
                {t('offLabel')}
              </span>
            </div>
            <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--foreground))] font-semibold mb-1">
              {t('useCode')} <span className="font-black text-[hsl(var(--primary))]">{t('code')}</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
              {t('validOn')}
            </p>
          </div>

          <div className="space-y-2 text-left bg-[hsl(var(--surface-muted))] p-4 rounded-(--radius)">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] mb-2">
              {t('whatYouGet')}
            </p>
            <ul className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--primary))] mt-0.5">✓</span>
                <span>{t('benefit1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--primary))] mt-0.5">✓</span>
                <span>{t('benefit2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--primary))] mt-0.5">✓</span>
                <span>{t('benefit3')}</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-[3px] border-[hsl(var(--border-strong))]">
            <Button
              onClick={handleUpgrade}
              className="flex-1 py-3 text-xs uppercase tracking-[0.2em]"
            >
              {t('upgradeNow')}
              <ArrowRight size={16} className="ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 py-3 text-xs uppercase tracking-[0.2em]"
            >
              {t('maybeLater')}
            </Button>
          </div>

          <p className="text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
            {t('exclusiveNote')}
          </p>
        </div>
      </Card>
    </div>
  );
}
