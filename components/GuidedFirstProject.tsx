'use client';

import { X, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface GuidedFirstProjectProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  currentStep?: number;
  totalSteps?: number;
}

/**
 * Guided onboarding component for first project creation
 * Shows step-by-step guidance to help users create their first project
 */
export default function GuidedFirstProject({
  isOpen,
  onClose,
  onStart,
}: GuidedFirstProjectProps) {
  const t = useTranslations('components.guidedFirstProject');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[hsl(var(--foreground))]/80 z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 md:p-8 space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-[hsl(var(--surface-muted))] rounded-[var(--radius)] transition-colors"
          aria-label={t('close')}
        >
          <X size={20} />
        </button>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border-[3px] border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 rounded-[var(--radius)] flex items-center justify-center">
              <Sparkles className="text-[hsl(var(--primary))]" size={24} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-[0.12em]">
                {t('welcome')}
              </h2>
              <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-1">
                {t('subtitle')}
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] mb-1">
                  {t('step1Title')}
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  {t('step1Desc')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] mb-1">
                  {t('step2Title')}
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  {t('step2Desc')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] mb-1">
                  {t('step3Title')}
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  {t('step3Desc')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] mb-1">
                  {t('step4Title')}
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  {t('step4Desc')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] mb-1">
                  {t('step5Title')}
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  {t('step5Desc')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-[3px] border-[hsl(var(--border-strong))]">
            <Button
              onClick={onStart}
              className="flex-1 py-3 text-xs uppercase tracking-[0.2em]"
            >
              {t('startCreating')}
              <ArrowRight size={16} className="ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 py-3 text-xs uppercase tracking-[0.2em]"
            >
              {t('figureItOut')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
