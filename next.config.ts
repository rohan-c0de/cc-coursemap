import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Explicitly bundle every state's prereqs.json into the serverless
  // functions that read them (prereqs/chain, prereqs/courses, and the state
  // layout's `fs.existsSync` check). Next's auto-tracing picked up the
  // original 8 states (va/nc/sc/ga/dc/md/de/tn) on earlier deploys but
  // silently stopped detecting new state subfolders added later — VT/CT/RI
  // shipped prereq data in PRs #22-#24 yet the files weren't bundled, so
  // the routes 404'd on prod. Globbing all states here future-proofs every
  // new prereq scraper.
  outputFileTracingIncludes: {
    "/api/[state]/prereqs/**": ["./data/*/prereqs.json"],
    "/[state]/**": ["./data/*/prereqs.json"],
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
