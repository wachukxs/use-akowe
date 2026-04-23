import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type AlertVariant = 'error' | 'success' | 'info';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  onDismiss?: () => void;
}

const config: Record<AlertVariant, { icon: typeof AlertCircle; styles: string }> = {
  error: {
    icon: AlertCircle,
    styles:
      'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] border-[hsl(var(--destructive))]',
  },
  success: {
    icon: CheckCircle2,
    styles:
      'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border-[hsl(var(--border-strong))]',
  },
  info: {
    icon: Info,
    styles:
      'bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))] border-[hsl(var(--border-strong))]',
  },
};

export default function Alert({
  variant = 'error',
  onDismiss,
  className,
  children,
  ...props
}: AlertProps) {
  const { icon: Icon, styles } = config[variant];

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 border-2 p-3 shadow-[4px_4px_0_rgba(29,41,57,0.14)]',
        styles,
        className
      )}
      {...props}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <p className="flex-1 text-[11px] uppercase tracking-[0.2em] leading-relaxed">{children}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
