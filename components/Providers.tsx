'use client';

import { SessionProvider } from 'next-auth/react';
import { ProjectProvider } from '@/lib/use-project-context';
import { SidebarProvider } from '@/components/Sidebar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ProjectProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </ProjectProvider>
    </SessionProvider>
  );
}
