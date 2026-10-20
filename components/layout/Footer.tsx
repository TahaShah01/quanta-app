"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUp, ArrowUpRight, Check, Copy } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { Magnetic } from "@/components/ui/Magnetic";
import { useSite } from "@/components/layout/SiteProvider";
import { visibleLinks } from "@/lib/features";
import { getSocialLinks } from "@/lib/socials";

const linkClass =
  "group inline-flex items-center gap-1 text-sm text-[var(--secondary)] transition-colors hover:text-[var(--foreground)]";

const noopSubscribe = () => () => { };

/** Ticks once a second on the client; renders a stable placeholder on the server. */
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

function cityOf(timeZone: string) {
  return (timeZone.split("/").pop() ?? timeZone).replace(/_/g, " ");
}


export function Footer() {
  const { settings, navigation, features } = useSite();
  const footer = navigation?.footer;
  const wordRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [copied, setCopied] = useState(false);

  const year = useSyncExternalStore(
    noopSubscribe,
    () => new Date().getFullYear(),
    () => 2026
  );

  const email = settings?.email ?? "";
  const brand = settings?.companyName || "Quanta";
  const timeZone = settings?.timezone || "UTC";
  const clock = useStudioClock(timeZone);
  const socials = getSocialLinks(settings?.socials);
  const columns = (footer?.columns ?? []).map((c) => ({
    ...c,
    links: visibleLinks(c.links, features),
  }));

  // Letters lift and fill as the pointer passes. Writes CSS variables directly,
  // so React doesn't re-render while the cursor moves.
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    letterRefs.current.forEach((el) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const distance = Math.hypot(e.clientX - cx, (e.clientY - cy) * 0.6);
      const reach = Math.max(rect.width * 1.6, 160);
      el.style.setProperty("--p", String(Math.max(0, 1 - distance / reach)));
    });
  };

  const onPointerLeave = () =>
    letterRefs.current.forEach((el) => el?.style.setProperty("--p", "0"));

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(id);
  }, [copied]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  const phone = settings?.phone ?? "";
  const linkColumns = columns.length + (socials.length > 0 ? 1 : 0);

  return (
    <footer className="relative mt-auto w-full overflow-hidden border-t border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-md">
      {/* Soft glow that rises from the wordmark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_70%_70%_at_50%_100%,var(--accent-subtle),transparent)]"
      />

      <Container className="relative pt-16 md:pt-24">
        {/* 1. Say hello + studio status */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <span className="text-label mb-5 block">{footer?.helloLabel}</span>
            {email && (
              <>
                <a
                  href={`mailto:${email}`}
                  className="group relative inline-flex max-w-full items-start gap-3 text-[clamp(1.6rem,4.4vw,4rem)] font-light leading-[1.08] tracking-tight text-[var(--foreground)]"
                >
                  <span className="break-all after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[var(--foreground)] after:transition-all after:duration-500 group-hover:after:w-full sm:break-normal">
                    {email}
                  </span>
                  <ArrowUpRight
                    className="mt-[0.25em] h-[0.5em] w-[0.5em] shrink-0 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1"
                    strokeWidth={1.5}
                  />
                </a>
                <div className="mt-6">
                  <Magnetic strength={0.3}>
                    <button
                      type="button"
                      onClick={copyEmail}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--border-hover)] px-4 py-2 font-mono text-xs uppercase tracking-widest text-[var(--secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                      aria-live="polite"
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? footer?.copied : footer?.copyEmail}
                    </button>
                  </Magnetic>
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-5 lg:justify-self-end">
            <div className="flex h-full min-w-[min(100%,22rem)] flex-col justify-between gap-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
              <AvailabilityBadge />
              <div className="flex flex-col gap-2">
                <span className="text-label">{footer?.clockLabel}</span>
                <div className="flex items-baseline gap-3">
                  <span
                    suppressHydrationWarning
                    className="font-mono text-4xl font-light tabular-nums tracking-tight text-[var(--foreground)] md:text-5xl"
                  >
                    {clock}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-widest text-[var(--secondary)]">
                    {cityOf(timeZone)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Brand + link columns */}
        <div
          className="footer-grid mt-14 grid grid-cols-2 gap-x-8 gap-y-12 border-t border-[var(--border)] pt-12 md:mt-20 md:pt-14"
          style={{ "--cols": linkColumns } as React.CSSProperties}
        >
          <div className="col-span-2 flex max-w-sm flex-col gap-5 md:col-span-1">
            <Link href="/" className="footer-brand group inline-flex items-center gap-3" aria-label={brand}>
              <Image
                src="/logo.svg"
                alt=""
                width={44}
                height={44}
                className="footer-mark h-11 w-11 shrink-0"
              />
              <span className="text-lg font-medium tracking-tight text-[var(--foreground)]">{brand}</span>
            </Link>
            {settings?.tagline && (
              <p className="text-sm leading-relaxed text-[var(--secondary)]">{settings.tagline}</p>
            )}
            {(phone || settings?.location) && (
              <ul className="flex flex-col gap-1 font-mono text-xs text-[var(--muted)]">
                {settings?.location && <li>{settings.location}</li>}
                {phone && <li>{phone}</li>}
              </ul>
            )}
          </div>

          {columns.map((column, i) => (
            <nav key={column.title} aria-label={column.title} className="flex flex-col gap-5">
              <span className="text-label">
                <span className="mr-2 text-[var(--muted)]">0{i + 1}</span>
                {column.title}
              </span>
              <ul className="flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {socials.length > 0 && (
            <div className="flex flex-col gap-5">
              <span className="text-label">
                <span className="mr-2 text-[var(--muted)]">0{columns.length + 1}</span>
                {footer?.connectTitle}
              </span>
              <ul className="flex flex-col gap-3">
                {socials.map(({ key, label, href }) => (
                  <li key={key}>
                    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {label}
                      <ArrowUpRight
                        size={12}
                        className="opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 3. Wordmark, spread to exactly the container width */}
        <div
          ref={wordRef}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          aria-hidden
          className="footer-word mt-16 select-none md:mt-20"
          style={{ "--n": brand.length } as React.CSSProperties}
        >
          {brand.toUpperCase().split("").map((letter, i) => (
            <span
              key={`${letter}-${i}`}
              ref={(el) => {
                letterRefs.current[i] = el;
              }}
              className="footer-letter"
              style={{ "--i": i, "--p": 0 } as React.CSSProperties}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* 4. Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] py-7 font-mono text-xs text-[var(--muted)] sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span>
              &copy; {year} {(footer?.copyright ?? brand).replace("{companyName}", brand)}
            </span>
            {(footer?.legalLinks ?? []).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-[var(--foreground)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group inline-flex items-center gap-1.5 transition-colors hover:text-[var(--foreground)]"
          >
            {footer?.backToTop}
            <ArrowUp size={12} className="transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>
      </Container>
    </footer>
  );
}
