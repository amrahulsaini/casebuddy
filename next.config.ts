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
    ],
  },
  // Ensure proper URL handling
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
};

export default nextConfig;
