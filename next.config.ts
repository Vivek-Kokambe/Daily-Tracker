import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" is for self-hosted Docker deploys; remove it for Vercel.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
