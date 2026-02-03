'use client';

import { SessionProvider } from 'next-auth/react';
import { ProjectProvider } from '@/lib/use-project-context';
import { SidebarProvider } from '@/components/Sidebar';
import GoogleAnalyticsUserId from '@/components/GoogleAnalyticsUserId';
import GoogleSignupTracking from '@/components/GoogleSignupTracking';
import ServerTrackingHandler from '@/components/ServerTrackingHandler';
import UTMTracker from '@/components/UTMTracker';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ProjectProvider>
        <SidebarProvider>
          <GoogleAnalyticsUserId />
          <GoogleSignupTracking />
          <ServerTrackingHandler />
          <UTMTracker />
          {children}
        </SidebarProvider>
      </ProjectProvider>
    </SessionProvider>
  );
}
