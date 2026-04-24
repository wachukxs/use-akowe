'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface TooltipProps {
  label: string;
  shortcut?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Tooltip({ label, shortcut, description, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const show = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPos({
          top: rect.bottom + 8,
          left: rect.left + rect.width / 2,
        });
      }
      setVisible(true);
    }, 200);
  }, []);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  return (
    <span
      ref={triggerRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className={cn('inline-flex', className)}
    >
      {children}
      {isMounted && visible && createPortal(
        <div
          role="tooltip"
          style={{ position: 'fixed', top: pos.top, left: pos.left, transform: 'translateX(-50%)' }}
          className="z-9999 pointer-events-none"
        >
          <div className="bg-[hsl(var(--foreground))] text-[hsl(var(--background))] rounded-(--radius) px-2.5 py-2 shadow-[4px_4px_0_rgba(0,0,0,0.3)] min-w-max max-w-[220px]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] leading-none">{label}</span>
              {shortcut && (
                <kbd className="text-[9px] font-mono bg-white/20 border border-white/25 rounded px-1 py-0.5 leading-none tracking-wide">
                  {shortcut}
                </kbd>
              )}
            </div>
            {description && (
              <p className="text-[10px] tracking-[0.06em] opacity-70 mt-1 leading-snug">{description}</p>
            )}
          </div>
        </div>,
        document.body,
      )}
    </span>
  );
}
