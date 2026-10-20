"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function SystemGraphic() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(".system-line", { strokeDashoffset: 0, opacity: 0.3 });
        gsap.set(".system-node", { scale: 1, opacity: 1 });
        gsap.set(".system-label", { opacity: 0.6, y: 0 });
        return;
      }

      // Setup initial states
      gsap.set(".system-line", { strokeDasharray: "400", strokeDashoffset: "400", opacity: 0 });
      gsap.set(".system-node", { scale: 0, opacity: 0, transformOrigin: "center" });
      gsap.set(".system-label", { opacity: 0, y: 5 });

      const tl = gsap.timeline({ delay: 0.6 });

      // Animate lines in
      tl.to(".system-line", {
        strokeDashoffset: 0,
        opacity: 0.3,
        duration: 1.6,
        ease: "power2.inOut",
        stagger: 0.08,
      })
      // Pop in nodes
      .to(".system-node", {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(1.5)",
        stagger: 0.04,
      }, "-=1.0")
      // Fade in labels
      .to(".system-label", {
        opacity: 0.6,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.04,
      }, "-=0.6");

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full aspect-square md:aspect-auto md:h-full relative flex items-center justify-center pointer-events-none"
      style={{ contain: "layout paint" }}
    >
      <style jsx>{`
        .pulse-circle {
          transform-box: fill-box;
          transform-origin: center;
          animation: pulseAnim 3s cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
        }
        @keyframes pulseAnim {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          70%, 100% {
            transform: scale(2.6);
            opacity: 0;
          }
        }
      `}</style>
      <svg viewBox="0 0 400 400" className="w-full h-full max-w-[500px] lg:max-w-[620px] 2xl:max-w-[760px] 3xl:max-w-[880px]" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Connecting Lines */}
        <path className="system-line" d="M200 80 L320 160 L280 300 L120 300 L80 160 Z" stroke="var(--foreground)" strokeWidth="1" strokeLinejoin="round" />
        <path className="system-line" d="M200 80 L200 200 L320 160" stroke="var(--foreground)" strokeWidth="1" />
        <path className="system-line" d="M200 200 L280 300" stroke="var(--foreground)" strokeWidth="1" />
        <path className="system-line" d="M200 200 L120 300" stroke="var(--foreground)" strokeWidth="1" />
        <path className="system-line" d="M200 200 L80 160" stroke="var(--foreground)" strokeWidth="1" />

        {/* Orbit/Subtle circles */}
        <circle className="system-line" cx="200" cy="200" r="140" stroke="var(--foreground)" strokeWidth="1" strokeDasharray="4 4" opacity="0.1" />

        {/* Central Node - The Core */}
        <circle className="pulse-circle" cx="200" cy="200" r="6" fill="var(--foreground)" style={{ animationDelay: "0s" }} />
        <circle className="system-node" cx="200" cy="200" r="4" fill="var(--foreground)" />
        <text className="system-label" x="210" y="195" fill="var(--foreground)" fontSize="8" letterSpacing="0.1em">CORE_00</text>

        {/* Node 1 - Top */}
        <circle className="pulse-circle" cx="200" cy="80" r="4" fill="var(--foreground)" style={{ animationDelay: "0.6s" }} />
        <circle className="system-node" cx="200" cy="80" r="3" fill="var(--secondary)" />
        <text className="system-label" x="210" y="75" fill="var(--foreground)" fontSize="8" letterSpacing="0.1em">UX_01</text>

        {/* Node 2 - Right */}
        <circle className="pulse-circle" cx="320" cy="160" r="4" fill="var(--foreground)" style={{ animationDelay: "1.2s" }} />
        <circle className="system-node" cx="320" cy="160" r="3" fill="var(--secondary)" />
        <text className="system-label" x="330" y="155" fill="var(--foreground)" fontSize="8" letterSpacing="0.1em">FE_02</text>

        {/* Node 3 - Bottom Right */}
        <circle className="pulse-circle" cx="280" cy="300" r="4" fill="var(--foreground)" style={{ animationDelay: "1.8s" }} />
        <circle className="system-node" cx="280" cy="300" r="3" fill="var(--secondary)" />
        <text className="system-label" x="290" y="295" fill="var(--foreground)" fontSize="8" letterSpacing="0.1em">BE_03</text>

        {/* Node 4 - Bottom Left */}
        <circle className="pulse-circle" cx="120" cy="300" r="4" fill="var(--foreground)" style={{ animationDelay: "2.4s" }} />
        <circle className="system-node" cx="120" cy="300" r="3" fill="var(--secondary)" />
        <text className="system-label" x="70" y="295" fill="var(--foreground)" fontSize="8" letterSpacing="0.1em">FE_04</text>

        {/* Node 5 - Left */}
        <circle className="pulse-circle" cx="80" cy="160" r="4" fill="var(--foreground)" style={{ animationDelay: "1.5s" }} />
        <circle className="system-node" cx="80" cy="160" r="3" fill="var(--secondary)" />
        <text className="system-label" x="40" y="155" fill="var(--foreground)" fontSize="8" letterSpacing="0.1em">QA_05</text>
      </svg>
    </div>
  );
}
