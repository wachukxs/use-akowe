'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';

interface LeadMagnetEmailCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  source: 'plagiarism' | 'import' | 'topic';
  isLoading?: boolean;
}

export default function LeadMagnetEmailCapture({
  isOpen,
  onClose,
  onSubmit,
  source,
  isLoading = false,
}: LeadMagnetEmailCaptureProps) {
  const t = useTranslations('components.leadMagnetEmailCapture');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('errorInvalidEmail'));
      return;
    }

    onSubmit(email);
  };

  const title = source === 'plagiarism'
    ? t('titlePlagiarism')
    : source === 'topic'
    ? t('titleTopic')
    : t('titleImport');

  const subtitle = source === 'plagiarism'
    ? t('subtitlePlagiarism')
    : source === 'topic'
    ? t('subtitleTopic')
    : t('subtitleImport');

  return (
    <div className="fixed inset-0 bg-[hsl(var(--foreground))]/60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-[var(--radius)] shadow-[8px_8px_0_rgba(29,41,57,0.15)] p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-bold uppercase tracking-[0.12em]">
                {title}
              </h3>
              <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                {subtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[hsl(var(--surface-muted))] rounded-[var(--radius)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mb-2 block">
                {t('emailLabel')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="w-full px-4 py-3 border-[3px] border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--background))] text-sm uppercase tracking-[0.1em] focus:outline-none focus:border-[hsl(var(--primary))]"
                disabled={isLoading}
              />
              {error && (
                <p className="text-xs uppercase tracking-[0.18em] text-red-500 mt-2">
                  {error}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full py-3"
              disabled={isLoading}
            >
              {isLoading ? t('processing') : t('showResults')}
            </Button>

            <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] text-center">
              {t('noSpam')}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
