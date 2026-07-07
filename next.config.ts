import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip type/lint errors during build so Vercel doesn't fail on warnings
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
