"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";

function labelFor(path: string, hint?: string, linkText?: string) {
  if (hint) return hint;
  if (path === "/") return "Home";
  const text = linkText?.replace(/\s+/g, " ").trim();
  if (text && text.length <= 28) return text;
  const last = path.split("/").filter(Boolean).pop() ?? "";
  return last.replace(/[-_]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Curtain wipe between pages. Internal link clicks are intercepted: the
 * curtain covers the screen, the route changes underneath, then it lifts.
 * Links can set `data-transition-label` to name the destination.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const pendingPath = useRef<string | null>(null);
  const busy = useRef(false);
  const safety = useRef<number | undefined>(undefined);

  const reveal = useRef(() => {});
  useEffect(() => {
    reveal.current = () => {
      const root = rootRef.current;
      if (!root || !busy.current) return;
      window.clearTimeout(safety.current);
      pendingPath.current = null;
      gsap
        .timeline({
          onComplete: () => {
            gsap.set(root, { autoAlpha: 0 });
            busy.current = false;
          },
        })
        .to(".pt-label", { yPercent: -110, opacity: 0, duration: 0.4, ease: "power3.in" })
        .to(".pt-panel-front", { yPercent: -100, duration: 0.8, ease: "power4.inOut" }, 0.1)
        .to(".pt-panel-back", { yPercent: -100, duration: 0.8, ease: "power4.inOut" }, 0.2);
    };
  });

  // The new route has rendered: lift the curtain.
  useEffect(() => {
    if (pendingPath.current && pathname === pendingPath.current) {
      const id = window.setTimeout(() => reveal.current(), 150);
      return () => window.clearTimeout(id);
    }
  }, [pathname]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onClick = (e: MouseEvent) => {
      if (reduced.matches || busy.current) return;
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as Element | null)?.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      if (url.pathname.startsWith("/admin")) return;

      e.preventDefault();
      const root = rootRef.current;
      if (!root) return router.push(url.pathname + url.search + url.hash);

      busy.current = true;
      pendingPath.current = url.pathname;
      if (labelRef.current) {
        labelRef.current.textContent = labelFor(url.pathname, anchor.dataset.transitionLabel, anchor.textContent ?? undefined);
      }

      gsap.set(root, { autoAlpha: 1 });
      gsap.set(".pt-panel-back, .pt-panel-front", { yPercent: 100 });
      gsap.set(".pt-label", { yPercent: 110, opacity: 1 });
      gsap
        .timeline({
          onComplete: () => {
            router.push(url.pathname + url.search + url.hash);
            safety.current = window.setTimeout(() => reveal.current(), 3500);
          },
        })
        .to(".pt-panel-back", { yPercent: 0, duration: 0.55, ease: "power3.inOut" })
        .to(".pt-panel-front", { yPercent: 0, duration: 0.6, ease: "power3.inOut" }, 0.08)
        .to(".pt-label", { yPercent: 0, duration: 0.5, ease: "power3.out" }, 0.4);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [router]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none invisible fixed inset-0 z-[150] opacity-0"
    >
      <div className="pt-panel-back absolute inset-0 bg-[var(--accent-hover)]" style={{ transform: "translateY(100%)" }} />
      <div
        className="pt-panel-front absolute inset-0 flex items-end bg-[var(--foreground)] p-6 md:p-14"
        style={{ transform: "translateY(100%)" }}
      >
        <span className="block overflow-hidden">
          <span
            ref={labelRef}
            className="pt-label block text-[clamp(3rem,12vw,10rem)] font-light leading-none tracking-tighter text-[var(--background)]"
          />
        </span>
      </div>
    </div>
  );
}
