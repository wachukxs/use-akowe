'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { X, Check } from 'lucide-react';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackForm({ isOpen, onClose }: FeedbackFormProps) {
  const t = useTranslations('components.feedbackButton');
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || session.user.name || '',
        email: prev.email || session.user.email || '',
      }));
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(t('errorSend'));
      }

      setSubmitted(true);
      setFormData({
        name: session?.user?.name || '',
        email: session?.user?.email || '',
        message: '',
      });

      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 3000);
    } catch {
      setError('Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile, side panel on desktop */}
      <div className="fixed z-50 bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] p-6 animate-in duration-200 inset-x-0 bottom-0 rounded-t-2xl max-h-[85vh] overflow-y-auto md:inset-x-auto md:bottom-auto md:right-4 md:top-1/2 md:-translate-y-1/2 md:w-full md:max-w-sm md:rounded-(--radius) md:max-h-none md:overflow-visible md:shadow-[8px_8px_0_rgba(29,41,57,0.16)] slide-in-from-bottom md:slide-in-from-right-4">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
          aria-label={t('close')}
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Check size={24} className="text-[hsl(142,76%,36%)]" />
            </div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
              {t('thankYou')}
            </h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              {t('sent')}
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">
              {t('heading')}
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              {t('intro')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('nameLabel')}
                placeholder={t('namePlaceholder')}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />

              <div className="space-y-1">
                <Input
                  label={t('emailLabel')}
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {t('emailHint')}
                </p>
              </div>

              <div className="w-full space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                  {t('messageLabel')}
                </label>
                <textarea
                  placeholder={t('messagePlaceholder')}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  required
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] rounded-(--radius) transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2 focus:border-[hsl(var(--border-strong))] focus:-translate-y-[0.125rem] focus:-translate-x-[0.125rem] placeholder:text-[hsl(var(--muted-foreground))] resize-none"
                />
              </div>

              {error && (
                <p className="text-xs font-medium text-[hsl(var(--destructive))] uppercase tracking-[0.08em]">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('sending') : t('sendButton')}
              </Button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
