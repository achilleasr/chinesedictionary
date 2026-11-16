import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only the Docker build needs the self-contained "standalone" output.
  // Vercel, local dev and the Playwright run keep the default behaviour.
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
};

export default nextConfig;
