import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Akowe - Write research that holds up.",
  description: "AI-powered academic writing and research tool for essays, thesis projects, and longform research documents.",
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" integrity="sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntILdUW9XmUC6+HX0sLNAK3q71HotJqlAn" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <Script 
          src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js" 
          integrity="sha384-cpW21h6RZv/phavutF+AuVYrr+dA8xD9zs6FwLpaCct6O9ctzYFfFr4dgmgccOTx" 
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
