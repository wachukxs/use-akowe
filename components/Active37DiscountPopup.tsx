'use client';

import { useRouter } from 'next/navigation';
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

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onUpgrade();
    onClose();
    router.push('/settings');
  };

  return (
    <div className="fixed inset-0 bg-[hsl(var(--foreground))]/90 z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-[4px] border-[hsl(var(--primary))] bg-[hsl(var(--surface))] p-6 md:p-8 space-y-6 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-[hsl(var(--surface-muted))] rounded-[var(--radius)] transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 border-[4px] border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 rounded-full flex items-center justify-center">
              <Gift className="text-[hsl(var(--primary))]" size={32} />
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-[0.12em] mb-2">
              Special Offer for Active Users! 🎉
            </h2>
            <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
              You&apos;ve been active {activeDays} {activeDays === 1 ? 'day' : 'days'} this week
            </p>
          </div>

          <div className="border-[3px] border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 p-4 rounded-[var(--radius)]">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="text-[hsl(var(--primary))]" size={20} />
              <span className="text-3xl font-black text-[hsl(var(--primary))]">
                37% OFF
              </span>
            </div>
            <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--foreground))] font-semibold mb-1">
              Use Code: <span className="font-black text-[hsl(var(--primary))]">ACTIVE37</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
              Valid on Pro plan subscriptions
            </p>
          </div>

          <div className="space-y-2 text-left bg-[hsl(var(--surface-muted))] p-4 rounded-[var(--radius)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] mb-2">
              What you&apos;ll get:
            </p>
            <ul className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--primary))] mt-0.5">✓</span>
                <span>Unlimited AI words & plagiarism checks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--primary))] mt-0.5">✓</span>
                <span>Advanced citation management</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--primary))] mt-0.5">✓</span>
                <span>Priority support & early features</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-[3px] border-[hsl(var(--border-strong))]">
            <Button
              onClick={handleUpgrade}
              className="flex-1 py-3 text-xs uppercase tracking-[0.2em]"
            >
              Upgrade Now with ACTIVE37
              <ArrowRight size={16} className="ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 py-3 text-xs uppercase tracking-[0.2em]"
            >
              Maybe Later
            </Button>
          </div>

          <p className="text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
            This offer is exclusive to active users like you. Don&apos;t miss out!
          </p>
        </div>
      </Card>
    </div>
  );
}
