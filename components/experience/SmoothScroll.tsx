"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { frame, sinks } from "@/lib/experience/store";

gsap.registerPlugin(ScrollTrigger);

/**
 * One scroll engine for everything:
 * Lenis smooths the wheel, GSAP's ticker drives Lenis, ScrollTrigger and
 * Framer Motion both read the same native scroll position, and the WebGL
 * scene reads `frame` each animation frame.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let lenis: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;
    let lastY = window.scrollY;

    const sync = (velocity: number) => {
      const max = ScrollTrigger.maxScroll(window);
      frame.scroll = max > 0 ? window.scrollY / max : 0;
      frame.velocity = velocity;
      ScrollTrigger.update();
    };

    const onNativeScroll = () => {
      const y = window.scrollY;
      sync(y - lastY);
      lastY = y;
    };

    if (reduced) {
      window.addEventListener("scroll", onNativeScroll, { passive: true });
    } else {
      const instance = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis = instance;
      instance.on("scroll", (e: Lenis) => sync(e.velocity));
      tick = (time: number) => instance.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    sinks.scrollTo = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (lenis) {
        lenis.scrollTo(el, { duration: 1.4 });
      } else {
        el.scrollIntoView({ behavior: "auto" });
      }
    };

    // Layout changes (pinned sections measuring themselves, fonts, images)
    // move trigger positions, so re-measure when the document height changes.
    let refreshTimer: number | undefined;
    const resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    resizeObserver.observe(document.documentElement);

    sync(0);

    return () => {
      window.clearTimeout(refreshTimer);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onNativeScroll);
      if (tick) gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis?.destroy();
      sinks.scrollTo = null;
    };
  }, []);

  return null;
}
