import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Backward-compatible redirects from old routes to /va/ prefixed routes
    return [
      { source: "/colleges", destination: "/va/colleges", permanent: true },
      { source: "/college/:id", destination: "/va/college/:id", permanent: true },
      { source: "/courses", destination: "/va/courses", permanent: true },
      { source: "/starting-soon", destination: "/va/starting-soon", permanent: true },
      { source: "/schedule", destination: "/va/schedule", permanent: true },
      { source: "/transfer", destination: "/va/transfer", permanent: true },
      { source: "/results", destination: "/va/results", permanent: true },
      { source: "/about", destination: "/va/about", permanent: true },
    ];
  },
};

export default nextConfig;
