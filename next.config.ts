import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["snarkjs"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;