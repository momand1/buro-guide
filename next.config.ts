import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // This allows files up to 5MB
    },
  },
};

export default nextConfig;