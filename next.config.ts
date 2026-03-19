import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
