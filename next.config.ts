import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keeps the dev-mode badge out of screen recordings.
  devIndicators: false,
  // The dashboard polls every few seconds; request logs would drown out the runner's output.
  logging: {
    incomingRequests: false,
  },
};

export default nextConfig;
