import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/app/fonts/**"],
  },
};

export default nextConfig;
