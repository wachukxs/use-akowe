'use client';

import { X, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[hsl(var(--foreground))]/80 z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 md:p-8 space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-[hsl(var(--surface-muted))] rounded-[var(--radius)] transition-colors"
          aria-label="Close"
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
                Welcome to Akọ̀wé!
              </h2>
              <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-1">
                Let&apos;s create your first project together
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] mb-1">
                  Step 1: Choose Your Project Type
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  Select Essay, Thesis, Journal Article, or Research Paper. Each type gets tailored sections.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] mb-1">
                  Step 2: Name Your Project
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  Give it a clear, descriptive name that reflects your research focus.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] mb-1">
                  Step 3: Define Your Research Topic
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  Be specific! Use the Topic Finder tool if you need help finding unique research angles.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] mb-1">
                  Step 4: Set Your Methodology
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  Choose Qualitative, Quantitative, or Mixed Methods based on your research approach.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] mb-1">
                  Step 5: Create & Start Writing
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  We&apos;ll generate structured sections with AI-powered guidance to help you write.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-[3px] border-[hsl(var(--border-strong))]">
            <Button
              onClick={onStart}
              className="flex-1 py-3 text-xs uppercase tracking-[0.2em]"
            >
              Start Creating My First Project
              <ArrowRight size={16} className="ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 py-3 text-xs uppercase tracking-[0.2em]"
            >
              I&apos;ll Figure It Out
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
