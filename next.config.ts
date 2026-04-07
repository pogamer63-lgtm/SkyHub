import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'crafatar.com' },
      { protocol: 'https', hostname: 'mc-heads.net' },
      { protocol: 'https', hostname: 'sky.coflnet.com' },
      { protocol: 'https', hostname: 'textures.minecraft.net' },
    ],
  },
  // Allow server-side only imports in API routes
  serverExternalPackages: [],
};

export default nextConfig;
