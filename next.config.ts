import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@blocknote/core",
    "@blocknote/react",
    "@blocknote/ariakit",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
