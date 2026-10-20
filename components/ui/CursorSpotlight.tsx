"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function CursorSpotlight() {
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isTouchDevice || reducedMotion) {
      if (spotlightRef.current) {
        spotlightRef.current.style.display = "none";
      }
      return;
    }

    const el = spotlightRef.current;
    if (!el) return;

    gsap.set(el, { x: -1000, y: -1000, opacity: 0 });

    let hasMoved = false;
    let targetX = -1000;
    let targetY = -1000;
    let ticking = false;

    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out", force3D: true });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out", force3D: true });

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX - 200;
      targetY = e.clientY - 200;

      if (!hasMoved) {
        hasMoved = true;
        gsap.to(el, { opacity: 1, duration: 1.2, ease: "power2.out" });
      }

      // Throttle GSAP calculation to display refresh rate via requestAnimationFrame
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          xTo(targetX);
          yTo(targetY);
          ticking = false;
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={spotlightRef}
      className="fixed top-0 left-0 w-[400px] h-[400px] pointer-events-none rounded-full will-change-transform z-[1]"
      style={{
        background: `radial-gradient(
          circle,
          var(--cursor-light-1) 0%,
          var(--cursor-light-2) 30%,
          var(--cursor-light-3) 55%,
          transparent 75%
        )`,
        opacity: 0,
        contain: "paint layout",
        transform: "translate3d(-1000px, -1000px, 0)",
      }}
    />
  );
}
