'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction
}: EmptyStateProps) {
  return (
    <div className="text-center py-8 sm:py-12 px-4">
      <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 text-[hsl(var(--muted-foreground))] mb-4">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-[hsl(var(--foreground))] mb-2">{title}</h3>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 max-w-md mx-auto">{description}</p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0">
        {action && (
          <Link href={action.href}>
            <Button className="w-full sm:w-auto min-h-[44px] touch-manipulation">
              {action.label}
            </Button>
          </Link>
        )}
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            className="w-full sm:w-auto min-h-[44px] touch-manipulation"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

export function LoadingState({ message }: { message?: string }) {
  const t = useTranslations('components.emptyState');
  return (
    <div className="text-center py-8 sm:py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--primary))] mx-auto mb-4"></div>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{message ?? t('loading')}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry
}: {
  message: string;
  onRetry?: () => void;
}) {
  const t = useTranslations('components.emptyState');
  return (
    <div className="text-center py-8 sm:py-12 px-4">
      <div className="mx-auto size-16 sm:size-24 text-[hsl(var(--destructive))] mb-4 flex items-center justify-center">
        <AlertTriangle className="size-full" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-[hsl(var(--foreground))] mb-2">{t('errorTitle')}</h3>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} className="min-h-[44px] touch-manipulation">
          {t('tryAgain')}
        </Button>
      )}
    </div>
  );
}
