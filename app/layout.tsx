import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import AdSenseScript from "@/components/AdSenseScript";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AuditMap Virginia — Find Community College Courses to Audit",
  description:
    "Discover which Virginia community colleges allow course auditing, what it costs, and how to apply. Free for Virginia residents 60+.",
  keywords: [
    "Virginia community college audit",
    "VCCS audit course",
    "audit college class Virginia",
    "free college courses seniors Virginia",
    "Virginia 60+ tuition waiver",
  ],
  openGraph: {
    title: "AuditMap Virginia",
    description:
      "Find Virginia community college courses to audit. Free for residents 60+.",
    siteName: "AuditMap Virginia",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AuditMap Virginia",
    description:
      "Find Virginia community college courses to audit. Free for residents 60+.",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://auditmap.virginia.example.com"
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <GoogleAnalytics />
        <AdSenseScript />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "AuditMap Virginia",
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://auditmap.virginia.example.com",
              description:
                "Find Virginia community college courses to audit. Compare audit policies, schedules, and costs across all 23 VCCS colleges.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || "https://auditmap.virginia.example.com"}/courses?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <Header />

        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                AuditMap Virginia — Helping Virginians discover course auditing
                opportunities.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <a href="/privacy" className="underline hover:text-gray-600">
                  Privacy Policy
                </a>
                <span>|</span>
                <p>
                  Policy data is manually verified. Always confirm with the
                  college before enrolling.
                </p>
                <span>|</span>
                <a
                  href="https://buymeacoffee.com/auditmap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-amber-400 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-500 transition-colors"
                >
                  <span>&#9749;</span> Support this project
                </a>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] text-gray-400">
              This is an independent project and is not affiliated with,
              endorsed by, or sponsored by the Virginia Community College System
              (VCCS). For official information visit{" "}
              <a
                href="https://www.vccs.edu"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-600"
              >
                vccs.edu
              </a>
              .
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
