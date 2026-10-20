"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/lib/experience/useReducedMotion";

interface ImageRevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wipes its content into view with a mask, then drifts it slightly as the
 * page scrolls. Put the image (or placeholder) inside; give this the size.
 */
export function ImageReveal({ children, className = "" }: ImageRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  if (reduced) {
    return <div ref={ref} className={`relative overflow-hidden ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      whileInView={{ clipPath: "inset(0 0 0% 0)" }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
      className={`relative overflow-hidden ${className}`}
    >
      <motion.div style={{ y, scale: 1.12 }} className="absolute inset-0">
        {children}
      </motion.div>
    </motion.div>
  );
}
