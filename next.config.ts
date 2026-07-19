import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Disable sharp-based image optimization so the app doesn't require the
  // platform-specific sharp native binary (which would need separate
  // win32/linux builds). Images still work — they're just served as-is.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
