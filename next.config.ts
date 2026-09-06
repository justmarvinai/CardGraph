import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // User images are processed entirely in the browser; Next's image optimiser
  // is never involved (and would cost Vercel Hobby quota).
  images: { unoptimized: true },
};

export default nextConfig;
