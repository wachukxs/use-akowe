'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { FileText, Settings, LogOut, PlusCircle } from 'lucide-react';
import Button from './ui/Button';

const navigation = [
  { name: 'Projects', href: '/dashboard', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="w-64 bg-[hsl(var(--surface))] border-r-[4px] border-[hsl(var(--border-strong))] flex flex-col h-screen fixed left-0 top-0 shadow-[12px_0_0_rgba(29,41,57,0.08)]">
      <div className="p-6 border-b-[4px] border-[hsl(var(--border-strong))]">
        <Link href="/dashboard" className="block">
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
        <Link href="/dashboard/new">
          <Button
            className="w-full justify-between px-4 py-4"
            onClick={() => console.log('Create New Project button clicked!')}
          >
            <span className="flex items-center gap-3 text-sm tracking-[0.12em]">
              <PlusCircle size={18} />
              New Project
            </span>
            <span className="text-[10px] tracking-[0.4em]">⌘N</span>
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
    </div>
  );
}

