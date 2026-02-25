'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { MessageSquarePlus } from 'lucide-react';
import FeedbackForm from '@/components/FeedbackForm';

export default function FeedbackButton() {
  const t = useTranslations('components.feedbackButton');
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (status === 'loading' || session) return null;

  return (
    <>
      {/* Desktop: vertical tab on right edge */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:block fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-4 rounded-l-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-x-1 border-2 border-r-0 border-[hsl(var(--primary))] cursor-pointer"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        aria-label={t('sendFeedbackAria')}
      >
        <span className="text-xs font-semibold uppercase tracking-widest">{t('feedback')}</span>
      </button>

      {/* Mobile: FAB bottom-right */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-6 right-4 z-40 flex items-center gap-2 px-4 py-3 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-2 border-[hsl(var(--border-strong))] rounded-full shadow-[4px_4px_0_rgba(29,41,57,0.12)] cursor-pointer transition-all duration-200 active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(29,41,57,0.12)]"
        aria-label={t('sendFeedbackAria')}
      >
        <MessageSquarePlus size={18} />
        <span className="text-xs font-semibold uppercase tracking-[0.12em]">{t('feedback')}</span>
      </button>

      <FeedbackForm isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
