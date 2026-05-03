import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Explicitly bundle every state's prereqs.json into the serverless
  // functions that PARSE it — only the API routes need the file content.
  // The state layout used to also need it for an `fs.existsSync` check,
  // but that was replaced with a registry-based `hasPrereqsCoverage()`
  // lookup so the layout no longer touches the filesystem.
  //
  // Removing the `/[state]/**` entry was the fix for Vercel deploys
  // failing on the 250 MB serverless function cap after phase 4 added
  // the programs/online routes. The previous glob force-bundled the
  // prereq JSON into every state route bundle even though only the
  // /api/[state]/prereqs/* handlers actually read the files.
  outputFileTracingIncludes: {
    "/api/[state]/prereqs/**": ["./data/*/prereqs.json"],
  },
  async redirects() {
    // Backward-compatible redirects from old routes to /va/ prefixed routes
    return [
      // /colleges is now a real all-states directory page — no redirect
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

const withMDX = createMDX({});

export default withMDX(nextConfig);
