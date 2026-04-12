import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: [
    "@splinetool/react-spline",
    "@splinetool/runtime",
  ],

  experimental: {
    optimizePackageImports: ["framer-motion"],
  },

  // Fix for multiple lockfiles warning
  outputFileTracingRoot: __dirname,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}

export default nextConfig