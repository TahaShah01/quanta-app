import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.40"],
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  async redirects() {
    // The Team page became People (team + partners).
    return [{ source: "/team", destination: "/people", permanent: true }];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
