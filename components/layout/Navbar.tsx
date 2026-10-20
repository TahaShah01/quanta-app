"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { useReducedMotion } from "@/lib/experience/useReducedMotion";
import { ArrowUpRight, Menu, Moon, Search, Sun, X } from "lucide-react";
import { originFrom, useTheme } from "@/components/theme/ThemeProvider";
import { Magnetic } from "@/components/ui/Magnetic";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { useSite } from "@/components/layout/SiteProvider";
import { OPEN_PALETTE_EVENT, useModKey } from "@/components/layout/CommandPalette";
import { isActivePath } from "@/components/layout/nav-links";
import { visibleLinks } from "@/lib/features";
import { getSocialLinks } from "@/lib/socials";

/** Both icons are in the markup; CSS shows the right one, so server and client HTML always match. */
function ThemeIcon({ size }: { size: number }) {
  return (
    <>
      <Sun size={size} className="theme-icon-sun" aria-hidden />
      <Moon size={size} className="theme-icon-moon" aria-hidden />
    </>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const { toggleTheme } = useTheme();
  const { settings, navigation, features } = useSite();
  const primaryLinks = visibleLinks(navigation?.links ?? [], features).map((l) => ({
    name: l.name,
    path: l.path,
  }));
  const menuLinks = [
    { name: navigation?.mobileHomeLabel ?? "Home", path: "/" },
    ...primaryLinks,
    { name: navigation?.mobileContactLabel ?? "Contact", path: navigation?.contactButton.href ?? "/contact" },
  ];
  const brand = settings?.companyName || "Quanta";
  const modKey = useModKey();
  const { scrollY } = useScroll();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Close the menu when the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > 240 && y > previous);
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const openPalette = () => {
    setOpen(false);
    window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
  };

  const socials = getSocialLinks(settings?.socials);
    const pill =
    "border backdrop-blur-xl transition-colors duration-500 " +
    (scrolled
      ? "border-[var(--border-hover)] bg-[var(--nav-bg)]"
      : "border-[var(--border)] bg-[var(--nav-bg-idle)]");

  return (
    <>
      <motion.header
        data-site-header
        initial={reduced ? false : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: hidden && !open ? -96 : 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none fixed inset-x-0 top-5 z-50 mx-auto flex w-full max-w-[3840px] items-center justify-between px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 2xl:px-24"
      >
        <div className={`pointer-events-auto flex h-14 items-center gap-2 rounded-full pl-5 pr-2 ${pill}`}>
          <Link href="/" className="group mr-3 flex items-center gap-2.5" aria-label={`${brand} home`}>
            <Image
              src="/logo.svg"
              alt=""
              width={22}
              height={22}
              className="h-5 w-5 transition-transform duration-500 group-hover:rotate-90"
            />
            <span className="font-mono text-sm font-semibold uppercase tracking-widest text-[var(--foreground)]">
              {brand}
            </span>
          </Link>

          <nav aria-label="Main" className="hidden items-center lg:flex">
            {primaryLinks.map((link) => {
              const active = isActivePath(pathname, link.path);
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  aria-current={active ? "page" : undefined}
                  className={`relative rounded-full px-3.5 py-2 text-[11px] font-medium uppercase tracking-widest transition-colors duration-300 ${
                    active
                      ? "text-[var(--foreground)]"
                      : "text-[var(--secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-full bg-[var(--accent-subtle)]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--foreground)] transition-colors hover:bg-[var(--accent-subtle)] lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <div className={`pointer-events-auto hidden h-14 items-center gap-1 rounded-full pl-2 pr-2 md:flex ${pill}`}>
          <button
            type="button"
            onClick={openPalette}
            className="flex h-10 items-center gap-2.5 rounded-full px-3.5 text-[var(--secondary)] transition-colors hover:bg-[var(--accent-subtle)] hover:text-[var(--foreground)]"
            aria-label="Search the site"
          >
            <Search size={14} />
            <kbd className="hidden rounded border border-[var(--border-hover)] px-1.5 py-px font-mono text-[11px] xl:inline">
              {modKey} K
            </kbd>
          </button>

          <SoundToggle />

          <button
            type="button"
            onClick={(e) => toggleTheme(originFrom(e))}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--secondary)] transition-colors hover:bg-[var(--accent-subtle)] hover:text-[var(--foreground)]"
            aria-label="Toggle light or dark mode"
          >
            <ThemeIcon size={15} />
          </button>

          <Magnetic strength={0.25}>
            <Link
              href={navigation?.contactButton.href ?? "/contact"}
              className="group ml-1 flex h-10 items-center gap-1.5 rounded-full bg-[var(--accent)] px-5 text-[11px] font-semibold uppercase tracking-widest text-[var(--accent-foreground)] transition-all hover:brightness-110"
            >
              {navigation?.contactButton.label ?? "Let's talk"}
              <ArrowUpRight
                size={13}
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          </Magnetic>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[45] flex flex-col bg-[var(--background)] lg:hidden"
            data-lenis-prevent
          >
            <div className="flex flex-1 flex-col justify-between overflow-y-auto px-6 pb-8 pt-28 sm:px-10">
              <nav aria-label="Mobile" className="flex flex-col">
                {menuLinks.map((link, i) => {
                  const active = isActivePath(pathname, link.path);
                  return (
                    <div key={link.path} className="overflow-hidden border-b border-[var(--border)]">
                      <motion.div
                        initial={{ y: "110%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "110%" }}
                        transition={{ duration: 0.6, delay: 0.15 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Link
                          href={link.path}
                          className="flex items-baseline gap-4 py-3.5"
                          aria-current={active ? "page" : undefined}
                        >
                          <span className="w-6 font-mono text-[11px] text-[var(--muted)]">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={`text-[clamp(2rem,9vw,3.5rem)] font-medium leading-none tracking-tight ${
                              active ? "text-[var(--foreground)]" : "text-[var(--secondary)]"
                            }`}
                          >
                            {link.name}
                          </span>
                        </Link>
                      </motion.div>
                    </div>
                  );
                })}
              </nav>

              <div className="mt-10 flex flex-col gap-6">
                <AvailabilityBadge showLink={false} className="w-fit" />
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-xs text-[var(--secondary)]">
                  {socials.map(({ key, label, href }) => (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-[var(--foreground)]"
                    >
                      {label}
                    </a>
                  ))}
                  <button
                    type="button"
                    onClick={openPalette}
                    className="ml-auto flex items-center gap-2 transition-colors hover:text-[var(--foreground)]"
                  >
                    <Search size={14} /> Search
                  </button>
                  <button
                    type="button"
                    onClick={(e) => toggleTheme(originFrom(e))}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-hover)] transition-colors hover:text-[var(--foreground)]"
                    aria-label="Toggle light or dark mode"
                  >
                    <ThemeIcon size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
