'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { FileText, Settings, LogOut, PlusCircle, Menu, X, BookOpen, Plus, Shield, Download, BookMarked, Bot } from 'lucide-react';
import Button from './ui/Button';
import { useState, useEffect, createContext, useContext } from 'react';

const navigation = [
  { name: 'Projects', href: '/dashboard', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Create context for sidebar state
interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
  showProjectTools: boolean;
  setShowProjectTools: (show: boolean) => void;
  projectToolsContent: React.ReactNode | null;
  setProjectToolsContent: (content: React.ReactNode | null) => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    return {
      isOpen: false,
      setIsOpen: () => {},
      isMobile: false,
      showProjectTools: false,
      setShowProjectTools: () => {},
      projectToolsContent: null,
      setProjectToolsContent: () => {},
    };
  }
  return context;
};

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showProjectTools, setShowProjectTools] = useState(false);
  const [projectToolsContent, setProjectToolsContent] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <SidebarContext.Provider value={{ 
      isOpen, 
      setIsOpen, 
      isMobile, 
      showProjectTools, 
      setShowProjectTools,
      projectToolsContent,
      setProjectToolsContent,
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function MobileMenuButton() {
  const { setIsOpen, isMobile } = useSidebar();
  
  if (!isMobile) return null;
  
  return (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed top-4 left-4 z-40 p-2 bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] rounded-[var(--radius)] shadow-[4px_4px_0_rgba(29,41,57,0.12)] md:hidden"
      aria-label="Open menu"
    >
      <Menu size={24} />
    </button>
  );
}

export function MobileProjectToolsButton({ onClick }: { onClick?: () => void }) {
  const { isMobile, setShowProjectTools } = useSidebar();
  
  if (!isMobile) return null;
  
  return (
    <button
      onClick={() => {
        setShowProjectTools(true);
        onClick?.();
      }}
      className="fixed bottom-4 right-4 z-40 p-3 bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] border-2 border-[hsl(var(--border-strong))] rounded-full shadow-[4px_4px_0_rgba(29,41,57,0.12)] md:hidden"
      aria-label="Open tools"
    >
      <Bot size={24} />
    </button>
  );
}

export function MobileToolsDrawer({ children }: { children: React.ReactNode }) {
  const { showProjectTools, setShowProjectTools, isMobile } = useSidebar();
  
  if (!isMobile || !showProjectTools) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 md:hidden"
        onClick={() => setShowProjectTools(false)}
      />
      
      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-[hsl(var(--surface))] border-t-[4px] border-[hsl(var(--border-strong))] rounded-t-2xl max-h-[80vh] overflow-y-auto md:hidden animate-in slide-in-from-bottom duration-300">
        <div className="sticky top-0 bg-[hsl(var(--surface))] p-4 border-b-2 border-[hsl(var(--border))] flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.24em]">Sections & Tools</h3>
          <button
            onClick={() => setShowProjectTools(false)}
            className="p-2 hover:bg-[hsl(var(--surface-muted))] rounded-[var(--radius)]"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isOpen, setIsOpen, isMobile } = useSidebar();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [pathname, isMobile, setIsOpen]);

  const sidebarContent = (
    <>
      <div className="p-6 border-b-[4px] border-[hsl(var(--border-strong))]">
        <Link href="/dashboard" className="block" onClick={() => isMobile && setIsOpen(false)}>
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-[hsl(var(--muted-foreground))]">
            Akọ̀wé
          </span>
          <h1 className="mt-3 text-3xl font-bold text-[hsl(var(--foreground))]">
            Research Studio
          </h1>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
            Write research that holds up
          </p>
        </Link>
      </div>

      <div className="p-4">
        <Link href="/dashboard/new" onClick={() => isMobile && setIsOpen(false)}>
          <Button
            className="w-full justify-between px-4 py-4"
            onClick={() => console.log('Create New Project button clicked!')}
          >
            <span className="flex items-center gap-3 text-sm tracking-[0.12em]">
              <PlusCircle size={18} />
              New Project
            </span>
            <span className="text-[10px] tracking-[0.4em] hidden sm:inline">⌘N</span>
          </Button>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => isMobile && setIsOpen(false)}
              className={cn(
                'flex items-center justify-between px-4 py-3 border-2 border-transparent rounded-[var(--radius)] transition-transform duration-150 uppercase tracking-[0.28em] text-[11px]',
                isActive
                  ? 'bg-[hsl(var(--accent))] border-[hsl(var(--border-strong))] text-[hsl(var(--accent-foreground))] -translate-x-[0.25rem] -translate-y-[0.25rem] shadow-[6px_6px_0_rgba(29,41,57,0.14)]'
                  : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-muted))] hover:border-[hsl(var(--border-strong))]'
              )}
            >
              <span className="flex items-center gap-3">
                <Icon size={18} />
                {item.name}
              </span>
              <span>→</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t-[4px] border-[hsl(var(--border-strong))] mt-auto">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-[var(--radius)] border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] flex items-center justify-center text-[hsl(var(--accent-foreground))] font-bold tracking-[0.16em]">
            {session?.user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
              {session?.user?.name || 'User'}
            </p>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            await signOut({ 
              callbackUrl: '/auth/signin',
              redirect: true 
            });
            // Force a hard refresh to clear any cached content
            window.location.href = '/auth/signin';
          }}
          className="w-full flex items-center justify-between px-4 py-3 border-2 border-transparent rounded-[var(--radius)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[hsl(var(--foreground))] transition-transform duration-150 hover:border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--surface-muted))] hover:-translate-y-[0.125rem] hover:-translate-x-[0.125rem]"
        >
          <span className="flex items-center gap-3">
            <LogOut size={16} />
            Sign Out
          </span>
          <span>↗</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-[hsl(var(--surface))] border-r-[4px] border-[hsl(var(--border-strong))] flex-col h-screen fixed left-0 top-0 shadow-[12px_0_0_rgba(29,41,57,0.08)]">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-[hsl(var(--surface))] border-r-[4px] border-[hsl(var(--border-strong))] flex flex-col z-50 shadow-[12px_0_0_rgba(29,41,57,0.08)] animate-in slide-in-from-left duration-300">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-[hsl(var(--surface-muted))] rounded-[var(--radius)]"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
