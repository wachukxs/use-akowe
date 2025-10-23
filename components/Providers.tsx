'use client';

import { SessionProvider } from 'next-auth/react';
import { ProjectProvider } from '@/lib/use-project-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </SessionProvider>
  );
}

