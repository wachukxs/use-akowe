'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  
  // Don't load GA on admin pages
  if (pathname?.startsWith('/admin')) {
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
