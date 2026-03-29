import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
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
              <p className="text-xs text-gray-400">
                Policy data is manually verified. Always confirm with the
                college before enrolling.
              </p>
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
