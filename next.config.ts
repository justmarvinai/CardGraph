import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // CardGraph has no server: no API routes, no server-side data, no rendering
  // of user content. A static export means the deploy is plain files — nothing
  // for the host to build serverless functions out of, and a clean fit for the
  // Vercel Hobby plan.
  output: 'export',
  // User images are processed entirely in the browser; Next's image optimiser
  // is never involved (and would cost Vercel Hobby quota).
  images: { unoptimized: true },
  webpack: (config) => {
    // Konva's Node build reaches for the native `canvas` package. The editor is
    // browser-only, so stub it out rather than shipping a native dependency.
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
};

export default nextConfig;
