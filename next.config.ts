import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
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
    ],
  },
};

export default nextConfig;
