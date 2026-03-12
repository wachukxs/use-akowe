'use client';

import { useState, useEffect } from 'react';
import { X, MessageSquarePlus } from 'lucide-react';
import { trackFeedback } from '@/lib/gtag';

const FORM_URL = 'https://forms.gle/f2jeLXbnXeu1PVJc7';
const NUDGE_SHOWN_KEY = 'akowe_feedback_nudge_shown';
const FIRST_OUTPUT_KEY = 'akowe_first_output_celebrated';

export default function FeedbackNudge() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show after the user's first AI output, and only once ever
    if (
      localStorage.getItem(FIRST_OUTPUT_KEY) === 'true' &&
      !localStorage.getItem(NUDGE_SHOWN_KEY)
    ) {
      // Wait 45 seconds so the user can experience the output first
      const timer = setTimeout(() => {
        setVisible(true);
        localStorage.setItem(NUDGE_SHOWN_KEY, 'true');
        trackFeedback.nudgeShown();
      }, 45_000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    trackFeedback.nudgeDismissed();
  };

  const handleClick = () => {
    setVisible(false);
    trackFeedback.nudgeClicked();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-72 border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 shadow-[6px_6px_0_rgba(29,41,57,0.12)]">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        aria-label="Dismiss feedback nudge"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-3 pr-4">
        <MessageSquarePlus size={18} className="mt-0.5 flex-shrink-0 text-[hsl(var(--primary))]" />
        <div>
          <p className="text-sm font-semibold mb-1">How&apos;s it going?</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3 leading-relaxed">
            Got 60 seconds? Tell us what&apos;s working and what isn&apos;t — we read every response.
          </p>
          <a
            href={FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]"
          >
            Share feedback
          </a>
        </div>
      </div>
    </div>
  );
}
