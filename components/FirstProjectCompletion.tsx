'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Sparkles, ArrowRight, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

/**
 * Component that shows a completion message after first project creation
 * Appears on the project editor page for first-time users
 */
export default function FirstProjectCompletion() {
  const t = useTranslations('components.firstProjectCompletion');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if this is the first project completion
    const firstProjectCompleted = localStorage.getItem('akowe_first_project_completed');
    const hasSeenCompletion = localStorage.getItem('akowe_first_project_completion_seen');
    
    if (firstProjectCompleted === 'true' && !hasSeenCompletion) {
      setIsVisible(true);
      // Mark as seen after a delay to allow user to read
      const timer = setTimeout(() => {
        localStorage.setItem('akowe_first_project_completion_seen', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-[hsl(var(--foreground))]/80 z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-4 border-[hsl(var(--primary))] bg-[hsl(var(--surface))] p-6 md:p-8 space-y-6 relative">
        <button
          onClick={() => {
            setIsVisible(false);
            localStorage.setItem('akowe_first_project_completion_seen', 'true');
          }}
          className="absolute top-4 right-4 p-2 hover:bg-[hsl(var(--surface-muted))] rounded-(--radius) transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 border-4 border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="text-[hsl(var(--primary))]" size={32} />
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-[0.12em] mb-2">
              {t('title')}
            </h2>
            <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
              {t('subtitle')}
            </p>
          </div>

          <div className="space-y-3 text-left bg-[hsl(var(--surface-muted))] p-4 rounded-(--radius)">
            <div className="flex items-start gap-3">
              <Sparkles className="text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] mb-1">
                  What You Can Do Now:
                </p>
                <ul className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] space-y-1 ml-5">
                  <li>• Use the AI Assistant to help write each section</li>
                  <li>• Add citations using the citation finder</li>
                  <li>• Check for plagiarism before submitting</li>
                  <li>• Export your work when complete</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            onClick={() => {
              setIsVisible(false);
              localStorage.setItem('akowe_first_project_completion_seen', 'true');
            }}
            className="w-full py-3 text-xs uppercase tracking-[0.2em]"
          >
            {t('startWriting')}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
