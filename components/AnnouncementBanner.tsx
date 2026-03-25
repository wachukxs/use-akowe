'use client';

import { useEffect, useState } from 'react';
import { X, ArrowRight, Megaphone } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface Announcement {
  _id: string;
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  type: 'banner' | 'modal';
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/announcements')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.announcements) setAnnouncements(data.announcements);
      })
      .catch(() => {}); // non-critical, fail silently
  }, []);

  function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
    fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  const visible = announcements.filter((a) => !dismissed.has(a._id));
  if (visible.length === 0) return null;

  const banners = visible.filter((a) => a.type === 'banner');
  const modals = visible.filter((a) => a.type === 'modal');

  return (
    <>
      {/* Banners — stacked at the top of content */}
      {banners.map((a) => (
        <div
          key={a._id}
          className="flex items-start gap-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-3 rounded-(--radius) shadow-[3px_3px_0_rgba(29,41,57,0.15)] mb-4"
          role="alert"
        >
          <Megaphone size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] leading-snug">{a.title}</p>
            <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{a.body}</p>
            {a.ctaText && a.ctaUrl && (
              <Link
                href={a.ctaUrl}
                className="inline-flex items-center gap-1 mt-2 text-xs font-semibold uppercase tracking-[0.16em] underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                {a.ctaText}
                <ArrowRight size={12} />
              </Link>
            )}
          </div>
          <button
            onClick={() => dismiss(a._id)}
            className="shrink-0 p-1 rounded hover:opacity-70 transition-opacity"
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      ))}

      {/* Modal — show the first one */}
      {modals.slice(0, 1).map((a) => (
        <div
          key={a._id}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => dismiss(a._id)}
          />
          {/* Panel */}
          <div className="relative z-10 w-full max-w-md border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[8px_8px_0_rgba(29,41,57,0.18)] p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Megaphone size={18} className="text-[hsl(var(--primary))] shrink-0" />
                <h2 className="text-base font-bold uppercase tracking-[0.14em] leading-snug">
                  {a.title}
                </h2>
              </div>
              <button
                onClick={() => dismiss(a._id)}
                className="shrink-0 p-1 rounded hover:bg-[hsl(var(--accent))] transition-colors"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed mb-5">
              {a.body}
            </p>
            <div className="flex items-center gap-3">
              {a.ctaText && a.ctaUrl && (
                <Link
                  href={a.ctaUrl}
                  className="inline-flex items-center gap-2 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
                >
                  {a.ctaText}
                  <ArrowRight size={13} />
                </Link>
              )}
              <button
                onClick={() => dismiss(a._id)}
                className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.14em] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
