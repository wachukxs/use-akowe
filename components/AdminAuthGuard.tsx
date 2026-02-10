'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

// Admin routes are not under [locale], so we avoid useTranslations here to prevent prerender errors.
const LABELS = {
  verifying: 'Verifying...',
  loggingOut: 'Logging out...',
  logout: 'Log out',
};

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip auth check if we're on the login page
    if (pathname === '/admin/login') {
      setIsAuthenticated(true); // Allow access to login page
      return;
    }

    // Check authentication status
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    try {
      // We can check if the cookie exists and is valid by making a simple request
      const response = await fetch('/api/admin/verify', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      router.push('/admin/login');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Loading state
  if (isAuthenticated === null && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--primary))] border-t-transparent mx-auto"></div>
          <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
            {LABELS.verifying}
          </p>
        </div>
      </div>
    );
  }

  // On login page, just render children
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Authenticated - render children with logout button
  if (isAuthenticated) {
    return (
      <div className="relative">
        {/* Floating logout button */}
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] rounded-(--radius) text-xs font-semibold uppercase tracking-[0.16em] hover:bg-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive-foreground))] hover:border-[hsl(var(--destructive))] transition-colors shadow-[4px_4px_0_rgba(29,41,57,0.12)]"
          >
            <LogOut size={14} />
            {isLoggingOut ? LABELS.loggingOut : LABELS.logout}
          </button>
        </div>
        {children}
      </div>
    );
  }

  // Not authenticated and not on login - show nothing (will redirect)
  return null;
}

