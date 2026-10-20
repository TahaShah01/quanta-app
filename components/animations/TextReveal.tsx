"use client";

import { ReactNode, useRef, useEffect } from "react";
import gsap from "gsap";
import { isIntroHeld, onIntroRelease } from "@/lib/experience/intro";

interface TextRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  scroll?: boolean;
}

// Global shared observer for text reveals
let sharedTextObserver: IntersectionObserver | null = null;
const textObserverCallbacks = new Map<Element, () => void>();

function getTextObserver() {
  if (typeof window === "undefined") return null;
  if (!sharedTextObserver) {
    sharedTextObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cb = textObserverCallbacks.get(entry.target);
            if (cb) {
              cb();
              textObserverCallbacks.delete(entry.target);
              sharedTextObserver?.unobserve(entry.target);
            }
          }
        }
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.05,
      }
    );
  }
  return sharedTextObserver;
}

export function TextReveal({
  children,
  className = "",
  delay = 0,
  duration = 1,
  scroll = false,
}: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      text.style.opacity = "1";
      text.style.transform = "none";
      return;
    }

    // Park the text in its "before" state straight away so it never shows
    // through the preloader (or blinks when its scroll trigger fires).
    gsap.set(text, { yPercent: 100, opacity: 0 });

    const playAnimation = () => {
      gsap.fromTo(
        text,
        {
          yPercent: 100,
          opacity: 0,
        },
        {
          yPercent: 0,
          opacity: 1,
          duration,
          delay,
          ease: "power3.out",
          force3D: true,
          clearProps: "transform",
        }
      );
    };

    if (!scroll) {
      if (isIntroHeld()) return onIntroRelease(playAnimation);
      playAnimation();
      return;
    }

    const observer = getTextObserver();
    if (observer) {
      textObserverCallbacks.set(container, playAnimation);
      observer.observe(container);
    } else {
      playAnimation();
    }

    return () => {
      if (observer) {
        textObserverCallbacks.delete(container);
        observer.unobserve(container);
      }
    };
  }, [delay, duration, scroll]);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <div ref={textRef} className="will-change-transform">
        {children}
      </div>
    </div>
  );
}
