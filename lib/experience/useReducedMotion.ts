"use client";

import { useMediaQuery } from "@/lib/experience/useMediaQuery";

/**
 * True when the visitor asked for reduced motion.
 * Unlike framer-motion's hook this reads a store with a server snapshot, so
 * the first client render matches the server HTML and hydration stays clean.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)", false);
}
