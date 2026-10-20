"use client";

import { Fragment, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useReducedMotion } from "@/lib/experience/useReducedMotion";

interface WordRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

/** Splits a line into words that rise into view one after another. */
export function WordReveal({ text, className = "", delay = 0 }: WordRevealProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  // Watch the outer span, not the words: each word starts clipped by its own
  // overflow-hidden wrapper, and an observer can never "see" a clipped target.
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const words = text.split(" ");

  return (
    <span ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => (
        // The space lives outside the clipped inline-block: a trailing space inside
        // an inline-block is collapsed by the browser and glues the words together.
        <Fragment key={i}>
          <span aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <motion.span
              className="inline-block"
              initial={reduced ? false : { y: "110%" }}
              animate={reduced || inView ? { y: 0 } : { y: "110%" }}
              transition={{ duration: 0.8, delay: delay + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
