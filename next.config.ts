import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    // Vercel free tier counts every /_next/image transformation against a monthly quota.
    // Serve originals directly to avoid burning that quota in production.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'pub-25daa8127a824bc58c903315ba000dc1.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'cdn.edus.lk',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
