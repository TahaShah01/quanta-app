"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function AmbientBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const ctx = gsap.context(() => {
      gsap.to(".ambient-orb-1", {
        opacity: 0.6,
        scale: 1.1,
        x: "2%",
        y: "2%",
        duration: 18,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        force3D: true,
      });

      gsap.to(".ambient-orb-2", {
        opacity: 0.5,
        scale: 1.15,
        x: "-3%",
        y: "-2%",
        duration: 22,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: -5,
        force3D: true,
      });

      gsap.to(".ambient-orb-3", {
        opacity: 0.55,
        scale: 1.05,
        x: "1%",
        y: "-3%",
        duration: 20,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: -10,
        force3D: true,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      style={{ contain: "strict" }}
    >
      {/* Radial gradients instead of blur filters: same glow, far cheaper to paint. */}
      <div
        className="ambient-orb-1 absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] max-w-[900px] max-h-[900px] rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(circle closest-side, var(--ambient-light-1) 0%, var(--ambient-light-2) 40%, rgba(255,255,255,0.003) 65%, transparent 100%)",
          opacity: 0.25,
          transform: "translate3d(0, 0, 0)",
        }}
      />

      <div
        className="ambient-orb-2 absolute top-[25%] right-[-15%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(circle closest-side, var(--ambient-light-1) 0%, var(--ambient-light-2) 40%, rgba(255,255,255,0.003) 65%, transparent 100%)",
          opacity: 0.2,
          transform: "translate3d(0, 0, 0)",
        }}
      />

      <div
        className="ambient-orb-3 absolute bottom-[-15%] right-[10%] w-[55vw] h-[55vw] max-w-[850px] max-h-[850px] rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(circle closest-side, var(--ambient-light-1) 0%, var(--ambient-light-2) 40%, rgba(255,255,255,0.003) 65%, transparent 100%)",
          opacity: 0.25,
          transform: "translate3d(0, 0, 0)",
        }}
      />
    </div>
  );
}
