"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { useSiteSettings } from "@/components/layout/SiteProvider";

type Consent = "accepted" | "declined";

export function CookieBanner() {
  const gaId = useSiteSettings()?.analytics?.ga4_measurement_id?.trim() || null;
  const [consent, setConsent] = useState<Consent | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("quanta_cookie_consent") as Consent | null;
    // Storage is only readable after mount, so this has to happen in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setConsent(saved);
    setMounted(true);
  }, []);

  if (!mounted || !gaId) return null;

  const handleAccept = () => {
    localStorage.setItem("quanta_cookie_consent", "accepted");
    setConsent("accepted");
  };

  const handleDecline = () => {
    localStorage.setItem("quanta_cookie_consent", "declined");
    setConsent("declined");
  };

  return (
    <>
      {consent === "accepted" && gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {consent === null && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] shadow-2xl animate-fade-in flex flex-col gap-3">
          <div className="text-sm text-[var(--foreground)] leading-relaxed">
            We use cookies to analyze web traffic and deliver a refined digital studio experience.
          </div>
          <div className="flex items-center justify-end gap-2 text-xs">
            <button
              onClick={handleDecline}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--muted)] transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] font-medium hover:brightness-110 transition-all shadow-sm"
            >
              Accept All
            </button>
          </div>
        </div>
      )}
    </>
  );
}
