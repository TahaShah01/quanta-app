"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SiteProvider } from "@/components/layout/SiteProvider";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { PageTransition } from "@/components/layout/PageTransition";
import { Easter } from "@/components/layout/Easter";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { SoundEffects } from "@/components/ui/SoundEffects";
import { SectionTint } from "@/components/ui/SectionTint";
import { SmoothScroll } from "@/components/experience/SmoothScroll";
import { SiteScene } from "@/components/experience/SiteScene";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { CursorSpotlight } from "@/components/ui/CursorSpotlight";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { CookieBanner } from "@/components/ui/CookieBanner";
import { BackToTop } from "@/components/ui/BackToTop";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import type { SiteSettings } from "@/lib/types";
import type { SearchEntry } from "@/lib/site";
import type { FeatureFlags } from "@/lib/types";
import type { NavigationContent } from "@/lib/pages-types";

interface SiteShellProps {
  children: React.ReactNode;
  settings: SiteSettings | null;
  searchIndex: SearchEntry[];
  navigation: NavigationContent;
  features: FeatureFlags;
  counts: { services: number; projects: number; team: number };
}

export function SiteShell({
  children,
  settings,
  searchIndex,
  navigation,
  features,
  counts,
}: SiteShellProps) {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <SiteProvider
      settings={settings}
      searchIndex={searchIndex}
      navigation={navigation}
      features={features}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 z-[70] rounded-md bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--accent-foreground)] shadow-lg outline-none"
      >
        Skip to main content
      </a>

      <SmoothScroll />
      <SiteScene counts={counts} />
      <SectionTint />
      <AmbientBackground />
      <CursorSpotlight />
      <div
        aria-hidden
        className="grid-bg pointer-events-none fixed inset-0 z-[2]"
        style={{ contain: "strict" }}
      />
      <ScrollProgress />

      <div className="relative z-10 flex flex-1 flex-col">
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        <main id="main-content" className="flex flex-1 flex-col">
          {children}
        </main>
        <Footer />
      </div>

      <PageTransition />
      <Easter />
      <CustomCursor />
      <SoundEffects />
      <CommandPalette />
      <BackToTop />
      <WhatsAppButton />
      <CookieBanner />
    </SiteProvider>
  );
}
