"use client";

import { ReactNode, useRef, useEffect } from "react";
import gsap from "gsap";
import { isIntroHeld, onIntroRelease } from "@/lib/experience/intro";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  /** If true, animation triggers on scroll into view. If false, triggers on mount (for hero sections). */
  scroll?: boolean;
}

// One IntersectionObserver shared by every FadeIn on the page.
let sharedObserver: IntersectionObserver | null = null;
const observerCallbacks = new Map<Element, () => void>();

function getSharedObserver() {
  if (typeof window === "undefined") return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cb = observerCallbacks.get(entry.target);
            if (cb) {
              cb();
              observerCallbacks.delete(entry.target);
              sharedObserver?.unobserve(entry.target);
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
  return sharedObserver;
}

export function FadeIn({
  children,
  className = "",
  delay = 0,
  duration = 0.8,
  yOffset = 20,
  scroll = false,
}: FadeInProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    const playAnimation = () => {
      gsap.fromTo(
        el,
        {
          opacity: 0,
          y: yOffset,
        },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: "power3.out",
          force3D: true,
          clearProps: "transform", // Cleans up style so GPU memory is released after animation finishes
        }
      );
    };

    if (!scroll) {
      // Hero reveals wait for the preloader curtain to lift.
      if (isIntroHeld()) return onIntroRelease(playAnimation);
      playAnimation();
      return;
    }

    const observer = getSharedObserver();
    if (observer) {
      observerCallbacks.set(el, playAnimation);
      observer.observe(el);
    } else {
      playAnimation();
    }

    return () => {
      if (observer) {
        observerCallbacks.delete(el);
        observer.unobserve(el);
      }
    };
  }, [delay, duration, yOffset, scroll]);

  return (
    <div ref={elementRef} className={`opacity-0 ${className}`}>
      {children}
    </div>
  );
}
