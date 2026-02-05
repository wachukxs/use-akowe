'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

const isProduction =
  process.env.NODE_ENV === 'production' &&
  typeof window !== 'undefined' &&
  !window.location.hostname.startsWith('localhost') &&
  !window.location.hostname.startsWith('127.0.0.1');

export default function GoogleAnalytics() {
  const pathname = usePathname();

  // Don't load GA on localhost or admin pages
  if (!isProduction || pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <Script 
        src="https://www.googletagmanager.com/gtag/js?id=G-KRXGBZVQ8Y"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-KRXGBZVQ8Y');
        `}
      </Script>
    </>
  );
}
