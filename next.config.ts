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
    // VCCS 2022 renames — these colleges officially changed names in 2022
    // and external links (press, Wikipedia, prior PDFs) may still point at
    // the old slug. Map each old slug to the current one before the generic
    // /college/:id → /va/college/:id rule below so the rename wins.
    // See issue #337.
    const vccsRenames: Array<{ old: string; current: string }> = [
      { old: "john-tyler", current: "brightpoint" },
      { old: "jtcc", current: "brightpoint" },
      { old: "thomas-nelson", current: "vpcc" },
      { old: "tncc", current: "vpcc" },
      { old: "dabney-s-lancaster", current: "mgcc" },
      { old: "dslcc", current: "mgcc" },
      { old: "lord-fairfax", current: "laurelridge" },
      { old: "lfcc", current: "laurelridge" },
    ];
    const renameRedirects = vccsRenames.flatMap((r) => [
      {
        source: `/va/college/${r.old}`,
        destination: `/va/college/${r.current}`,
        permanent: true,
      },
      {
        source: `/college/${r.old}`,
        destination: `/va/college/${r.current}`,
        permanent: true,
      },
    ]);

    // Backward-compatible redirects from old un-prefixed routes to /va/.
    return [
      ...renameRedirects,
      // /colleges is now a real all-states directory page — no redirect
      { source: "/college/:id", destination: "/va/college/:id", permanent: true },
      { source: "/courses", destination: "/va/courses", permanent: true },
      { source: "/starting-soon", destination: "/va/starting-soon", permanent: true },
      { source: "/schedule", destination: "/va/schedule", permanent: true },
      { source: "/transfer", destination: "/va/transfer", permanent: true },
      { source: "/results", destination: "/va/results", permanent: true },
      { source: "/about", destination: "/va/about", permanent: true },
      { source: "/program/:slug", destination: "/va/program/:slug", permanent: true },
    ];
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
