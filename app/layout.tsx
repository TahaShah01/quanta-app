import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { themeInitScript } from "@/components/theme/ThemeInitScript";
import { SiteShell } from "@/components/layout/SiteShell";
import {
  getFeatures,
  getNavigation,
  getSearchIndex,
  getSettings,
  getSiteData,
} from "@/lib/site";

export function generateMetadata(): Metadata {
  const settings = getSettings();
  const seo = settings?.seo;
  const name = settings?.companyName || "Quanta";
  const title = seo?.title || `${name} | Software Studio`;
  const description = seo?.description || settings?.tagline || "";

  return {
    metadataBase: new URL(seo?.siteUrl || "http://localhost:3000"),
    title,
    description,
    keywords: seo?.keywords,
    authors: [{ name: name }],
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_US",
      siteName: name,
    },
    twitter: { card: "summary_large_image", title, description },
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      shortcut: "/icon.svg",
      apple: "/apple-icon",
    },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { counts } = getSiteData();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-[var(--background)]">
        <ThemeProvider>
          {/* The shell reads the pathname; routes with runtime params need a boundary above it. */}
          <Suspense fallback={null}>
            <SiteShell
              settings={getSettings()}
              searchIndex={getSearchIndex()}
              navigation={getNavigation()}
              features={getFeatures()}
              counts={counts}
            >
              {children}
            </SiteShell>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
