'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
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
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 text-gray-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {action && (
          <Link href={action.href}>
            <Button className="w-full sm:w-auto">
              {action.label}
            </Button>
          </Link>
        )}
        {secondaryAction && (
          <Button 
            variant="outline" 
            onClick={secondaryAction.onClick}
            className="w-full sm:w-auto"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-600">{message}</p>
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
  return (
    <div className="text-center py-12">
      <div className="mx-auto size-24 text-red-500 mb-4 flex items-center justify-center">
        <AlertTriangle className="size-full" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <Button onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
