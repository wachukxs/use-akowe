import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// pSEO routes that are excluded from the middleware matcher but still need
// locale-prefix enforcement. Without this, bots hitting /fields/research-help
// (no locale) receive a 5xx instead of a proper redirect to /en/fields/research-help.
const pseoRoutes = [
  'topics',
  'templates',
  'templates-keywords',
  'methods',
  'guides',
  'guides-keywords',
  'fields',
  'faq',
  'faq-keywords',
  'compare',
  'compare-keywords',
  'combinations',
  'citations',
  'citation-styles',
  'citation-sources',
  'latex-guide',
  'for-llms',
  'about',
  'terms',
  'privacy',
  'ambassador',
  'affiliate',
  'tools',
];

const nextConfig: NextConfig = {
  // Note: If you see a warning about multiple lockfiles, it's because there's a
  // package-lock.json in your home directory. This is safe to ignore - Next.js
  // will use the lockfile in this project directory.
  async redirects() {
    // Redirect locale-less pSEO paths to their /en/ equivalents.
    // These routes are excluded from the middleware matcher (to avoid serverless
    // invocations on bot traffic), so Next.js config-level redirects are needed
    // to handle requests that arrive without a locale prefix.
    return pseoRoutes.map((route) => ({
      source: `/${route}/:path*`,
      destination: `/en/${route}/:path*`,
      permanent: false,
    }));
  },
};

export default withNextIntl(nextConfig);
