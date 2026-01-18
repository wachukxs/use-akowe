import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: If you see a warning about multiple lockfiles, it's because there's a
  // package-lock.json in your home directory. This is safe to ignore - Next.js
  // will use the lockfile in this project directory.
  // Disable caching for development to prevent stale content
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
