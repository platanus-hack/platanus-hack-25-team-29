import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  productionBrowserSourceMaps: true,
};

export default nextConfig;
