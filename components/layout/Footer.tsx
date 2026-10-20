"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUp, ArrowUpRight, Check, Copy, MessageCircle, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Magnetic } from "@/components/ui/Magnetic";
import { useSite } from "@/components/layout/SiteProvider";
import { getSocialLinks } from "@/lib/socials";

const noopSubscribe = () => () => {};

/** Live studio clock: ticks every second on the client, renders placeholder on server. */
function useStudioClock(timeZone: string) {
  const subscribe = useCallback((onChange: () => void) => {
    const id = window.setInterval(onChange, 1000);
    return () => window.clearInterval(id);
  }, []);

  const getSnapshot = useCallback(() => {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date());
    } catch {
      return "--:--:--";
    }
  }, [timeZone]);

  return useSyncExternalStore(subscribe, getSnapshot, () => "--:--:--");
}

function formatCity(timeZone: string) {
  return (timeZone.split("/").pop() ?? timeZone).replace(/_/g, " ");
}

export function Footer() {
  const { settings, features } = useSite();
  const [copied, setCopied] = useState(false);

  const year = useSyncExternalStore(
    noopSubscribe,
    () => new Date().getFullYear(),
    () => 2026
  );

  const email = settings?.email || "hello@quanta.studio";
  const brand = settings?.companyName || "Quanta";
  const timeZone = settings?.timezone || "Asia/Karachi";
  const clock = useStudioClock(timeZone);
  const city = formatCity(timeZone);
  const socials = getSocialLinks(settings?.socials);

  const waConfig = settings?.whatsapp;
  const showWhatsApp = !!(waConfig?.visible && waConfig?.number?.trim());
  const waHref = showWhatsApp
    ? `https://wa.me/${waConfig!.number.replace(/\D/g, "")}${
        waConfig!.message ? `?text=${encodeURIComponent(waConfig!.message.trim())}` : ""
      }`
    : "";

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  const navExplore = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Work & Case Studies", href: "/projects" },
    { label: "People & Team", href: "/people" },
    { label: "Client Reviews", href: "/reviews" },
  ];

  const navPlatform = [
    ...(features?.portal !== false ? [{ label: "Client Portal", href: "/portal" }] : []),
    { label: "Studio About", href: "/about" },
    { label: "Changelog", href: "/changelog" },
    { label: "Studio Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ];

  return (
    <footer
      role="contentinfo"
      aria-label="Site Footer"
      className="relative mt-auto w-full overflow-hidden border-t border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] transition-colors duration-500"
    >
      {/* Ambient lighting & subtle technical grid matching global design system */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,var(--accent-subtle),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--border-hover)] to-transparent"
      />
      <div
        aria-hidden="true"
        className="grid-bg pointer-events-none absolute inset-0 -z-10 opacity-20"
      />

      <Container className="relative pt-12 md:pt-16 pb-10">
        {/* 1. Studio Status & Coordinate Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-8 text-xs font-mono">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            >
              <Image src="/logo.svg" alt="" width={22} height={22} className="h-5 w-5" />
              <span className="font-semibold uppercase tracking-wider">{brand} STUDIO</span>
            </Link>
            <span className="text-[var(--border)]">/</span>
            <span className="text-label text-[11px] text-[var(--muted)] hidden sm:inline">
              Software & Systems Architecture
            </span>
          </div>

          <div className="flex items-center gap-5 text-[var(--secondary)]">
            <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]" />
              </span>
              <span className="text-[11px] uppercase tracking-wider text-[var(--success)] font-medium font-mono">
                {settings?.availability?.message || "Accepting Q1/Q2 Engagements"}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-[11px] text-[var(--muted)]">
              <span>{city}</span>
              <span className="tabular-nums text-[var(--foreground)]">{clock}</span>
            </div>
          </div>
        </div>

        {/* 2. Primary Focal Section: Project Invitation & Navigation Hub */}
        <div className="grid grid-cols-1 gap-12 pt-12 md:grid-cols-12 lg:gap-16">
          {/* Left Column: Direct Invitation & Contact Actions */}
          <div className="flex flex-col justify-between gap-8 md:col-span-5 lg:col-span-6">
            <div>
              <span className="text-label font-mono !text-[var(--accent)]">
                Next Steps // Start a Conversation
              </span>
              <h2 className="text-section mt-4 font-light tracking-tight text-[var(--foreground)]">
                Let&apos;s architect something <span className="font-normal italic text-[var(--accent)]">extraordinary</span> together.
              </h2>
              <p className="text-body mt-4 max-w-lg text-[var(--secondary)]">
                {settings?.tagline ||
                  "A five-person engineering and design studio partnering with ambitious founders and teams to build thoughtful, resilient digital products."}
              </p>
            </div>

            {/* Quick Action Buttons with Magnetic Affordance */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Magnetic strength={0.3}>
                <Link
                  href="/contact"
                  className="btn-primary group gap-2 px-6 py-3 font-mono text-xs uppercase tracking-wider"
                >
                  <span>Initiate Engagement</span>
                  <ArrowUpRight
                    size={14}
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              </Magnetic>

              <Magnetic strength={0.2}>
                <button
                  type="button"
                  onClick={copyEmail}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[var(--foreground)] transition-all hover:border-[var(--accent)]"
                  aria-live="polite"
                >
                  {copied ? (
                    <Check size={14} className="text-[var(--success)]" />
                  ) : (
                    <Copy size={14} className="text-[var(--secondary)]" />
                  )}
                  <span>{copied ? "Copied to Clipboard" : email}</span>
                </button>
              </Magnetic>

              {showWhatsApp && (
                <Magnetic strength={0.2}>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[var(--foreground)] transition-all hover:border-[#25d366]/50 hover:text-[#25d366]"
                  >
                    <MessageCircle size={14} className="text-[#25d366]" />
                    <span>WhatsApp</span>
                  </a>
                </Magnetic>
              )}
            </div>
          </div>

          {/* Right Column: Structured Navigation Clusters */}
          <div className="grid grid-cols-2 gap-8 md:col-span-7 lg:col-span-6 sm:grid-cols-2 lg:grid-cols-2">
            {/* Cluster 1: Explore Studio */}
            <div className="flex flex-col gap-4">
              <h3 className="text-label font-mono text-[11px] text-[var(--muted)]">
                01 // Explore
              </h3>
              <ul className="flex flex-col gap-2.5">
                {navExplore.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group inline-flex items-center gap-1.5 text-sm text-[var(--secondary)] transition-colors hover:text-[var(--foreground)]"
                    >
                      <span>{item.label}</span>
                      <ArrowUpRight
                        size={12}
                        className="opacity-0 -translate-x-1 translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 text-[var(--accent)]"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cluster 2: Ecosystem & Operations */}
            <div className="flex flex-col gap-4">
              <h3 className="text-label font-mono text-[11px] text-[var(--muted)]">
                02 // Platform
              </h3>
              <ul className="flex flex-col gap-2.5">
                {navPlatform.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group inline-flex items-center gap-1.5 text-sm text-[var(--secondary)] transition-colors hover:text-[var(--foreground)]"
                    >
                      <span>{item.label}</span>
                      <ArrowUpRight
                        size={12}
                        className="opacity-0 -translate-x-1 translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 text-[var(--accent)]"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cluster 3: Presence & Verified Socials (Spans 2 cols on mobile/tablet) */}
            <div className="col-span-2 border-t border-[var(--border)] pt-6 mt-2 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-label font-mono text-[11px] text-[var(--muted)]">
                  03 // Network & Social Presence
                </span>
                <span className="font-mono text-[11px] text-[var(--muted)]">
                  {settings?.location || "Remote Worldwide"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {socials.map(({ key, label, href, Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] px-3 py-1.5 text-xs text-[var(--secondary)] transition-all hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                  >
                    <Icon size={13} />
                    <span>{label}</span>
                    <ArrowUpRight size={10} className="text-[var(--muted)]" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Monumental Architectural Wordmark */}
        <div className="relative mt-16 md:mt-24 select-none overflow-hidden border-t border-[var(--border)] pt-8">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--muted)] pb-4">
            <span>QUANTA SYSTEM ARCHITECTURE</span>
            <span className="hidden sm:inline">PRECISION CRAFTED DIGITAL EXPERIENCES</span>
            <span>EST. 2025</span>
          </div>

          <div
            aria-hidden="true"
            className="w-full text-center font-mono font-bold tracking-tighter text-[clamp(3.5rem,15vw,11.5rem)] leading-none text-transparent bg-clip-text bg-gradient-to-b from-[var(--foreground)]/20 via-[var(--foreground)]/5 to-transparent"
          >
            {brand.toUpperCase()}
          </div>
        </div>

        {/* 4. Bottom Meta Strip */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-6 font-mono text-xs text-[var(--muted)] sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-4 text-center sm:text-left">
            <span>&copy; {year} {brand} Studio. All rights reserved.</span>
            <span className="hidden sm:inline text-[var(--border)]">&bull;</span>
            <div className="flex items-center gap-1.5 text-[var(--success)]">
              <ShieldCheck size={13} />
              <span>Verified Client Infrastructure</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Magnetic strength={0.2}>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-[var(--secondary)] transition-all hover:border-[var(--accent)] hover:text-[var(--foreground)]"
              >
                <span>Back to Top</span>
                <ArrowUp size={12} className="transition-transform group-hover:-translate-y-0.5" />
              </button>
            </Magnetic>
          </div>
        </div>
      </Container>
    </footer>
  );
}
