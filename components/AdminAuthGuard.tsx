'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

const LABELS = {
  verifying: 'Verifying...',
  loggingOut: 'Logging out...',
  logout: 'Log out',
};

type AdminRole = 'full_access' | 'read_only';

interface AdminAuthContext {
  role: AdminRole | null;
  isFullAccess: boolean;
}

const AdminAuthCtx = createContext<AdminAuthContext>({
  role: null,
  isFullAccess: false,
});

export function useAdminAuth() {
  return useContext(AdminAuthCtx);
}

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/admin/login') {
      setIsAuthenticated(true);
      return;
    }

    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setRole(data.role ?? 'full_access');
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

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const ctxValue: AdminAuthContext = {
    role,
    isFullAccess: role === 'full_access',
  };

  if (isAuthenticated) {
    return (
      <AdminAuthCtx.Provider value={ctxValue}>
        <div className="relative">
          <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
            {role && (
              <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] rounded-(--radius) border-2 ${
                role === 'full_access'
                  ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                  : 'border-[hsl(var(--muted-foreground))] text-[hsl(var(--muted-foreground))]'
              }`}>
                {role === 'full_access' ? 'Full Access' : 'Read Only'}
              </span>
            )}
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
      </AdminAuthCtx.Provider>
    );
  }

  return null;
}
