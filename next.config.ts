import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['sharp'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'casetool.casebuddy.co.in',
      },
      {
        protocol: 'https',
        hostname: 'casebuddy.co.in',
      },
      {
        protocol: 'https',
        hostname: 'atcasa.co.in',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
    // Allow images from the public folder
    unoptimized: false,
  },
};

export default nextConfig;
