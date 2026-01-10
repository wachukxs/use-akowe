'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { X, Check } from 'lucide-react';

export default function FeedbackButton() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  // Pre-fill name and email when user is signed in
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send feedback');
      }

      setSubmitted(true);
      // Reset form but keep user's info if signed in
      setFormData({
        name: session?.user?.name || '',
        email: session?.user?.email || '',
        message: '',
      });
      
      // Reset after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
      }, 3000);
    } catch {
      setError('Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Feedback Button - Hidden on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:block fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-4 rounded-l-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-x-1 border-2 border-r-0 border-[hsl(var(--primary))]"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        aria-label="Send Feedback"
      >
        <span className="text-xs font-semibold uppercase tracking-widest">Feedback</span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Popup Modal */}
      {isOpen && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] rounded-[var(--radius)] shadow-[8px_8px_0_rgba(29,41,57,0.16)] p-6 animate-in slide-in-from-right-4 duration-200">
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Check size={24} className="text-[hsl(142,76%,36%)]" />
              </div>
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                Thank you!
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                Your feedback has been sent.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">
                Send Feedback
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                We&apos;d love to hear from you!
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />

                <div className="space-y-1">
                  <Input
                    label="Email (optional)"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    We&apos;d love to reach out if we have questions or updates.
                  </p>
                </div>

                <div className="w-full space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                    Message
                  </label>
                  <textarea
                    placeholder="Tell us what you think..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] rounded-[var(--radius)] transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2 focus:border-[hsl(var(--border-strong))] focus:-translate-y-[0.125rem] focus:-translate-x-[0.125rem] placeholder:text-[hsl(var(--muted-foreground))] resize-none"
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
                  {isSubmitting ? 'Sending...' : 'Send Feedback'}
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
