"use client";

import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { useReducedMotion } from "@/lib/experience/useReducedMotion";

function wrap(min: number, max: number, value: number): number {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
}

interface VelocityMarqueeProps {
  items: string[];
  /** Base speed, in percent of one loop per second */
  speed?: number;
}

/**
 * A marquee that reacts to scrolling: it speeds up, skews and reverses with
 * the page's scroll velocity, then settles back to a slow drift.
 */
export function VelocityMarquee({ items, speed = 2.2 }: VelocityMarqueeProps) {
  const reduced = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(velocity, { damping: 50, stiffness: 400 });
  const boost = useTransform(smoothVelocity, [-1500, 0, 1500], [-4, 0, 4], {
    clamp: false,
  });
  const skewX = useTransform(smoothVelocity, [-1500, 1500], [7, -7], {
    clamp: true,
  });
  const direction = useRef(-1);

  // The track holds two identical halves, so wrapping at -50% is seamless.
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (reduced) return;
    const factor = boost.get();
    if (factor < -0.05) direction.current = 1;
    else if (factor > 0.05) direction.current = -1;

    const base = direction.current * speed * (delta / 1000);
    baseX.set(baseX.get() + base + base * Math.abs(factor));
  });

  if (items.length === 0) return null;

  // Repeat the items until one half comfortably exceeds the viewport.
  const repeats = Math.max(1, Math.ceil(8 / items.length));
  const half = Array.from({ length: repeats }).flatMap(() => items);

  return (
    <div
      aria-hidden
      className="overflow-hidden border-y border-[var(--border)] py-8 md:py-12"
    >
      <motion.div
        style={{ x, skewX }}
        className="flex w-max items-center whitespace-nowrap will-change-transform"
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {half.map((item, i) => (
              <div key={`${copy}-${i}`} className="flex items-center">
                <span
                  className={`px-[0.35em] text-[clamp(2.75rem,8vw,8rem)] font-medium leading-none tracking-tighter ${
                    i % 2 === 0
                      ? "text-[var(--foreground)]"
                      : "text-transparent [-webkit-text-stroke:1px_var(--foreground)]"
                  }`}
                >
                  {item}
                </span>
                <span className="mx-[0.2em] block h-[0.14em] w-[0.14em] rotate-45 bg-[var(--muted)] text-[clamp(2.75rem,8vw,8rem)]" />
              </div>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
