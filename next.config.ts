import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Note: If you see a warning about multiple lockfiles, it's because there's a
  // package-lock.json in your home directory. This is safe to ignore - Next.js
  // will use the lockfile in this project directory.
};

export default withNextIntl(nextConfig);
