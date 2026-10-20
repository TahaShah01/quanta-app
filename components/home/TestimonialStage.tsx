"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/experience/useReducedMotion";
import { ArrowLeft, ArrowRight, Quote, Star } from "lucide-react";
import type { Testimonial } from "@/lib/types";

const INTERVAL_MS = 7000;
const EASE = [0.22, 1, 0.36, 1] as const;

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TestimonialStage({
  testimonials,
  labels,
}: {
  testimonials: Testimonial[];
  labels: { previous: string; next: string; list: string };
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const count = testimonials.length;
  const autoplay = !reduced && !paused && count > 1;

  useEffect(() => {
    if (!autoplay) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [autoplay, count, index]);

  const go = (next: number) => setIndex((next + count) % count);
  const current = testimonials[Math.min(index, count - 1)];
  const stars = Math.min(5, Math.max(1, current.rating || 5));

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="relative"
    >
      <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 md:p-12">
        <Quote
          aria-hidden
          size={96}
          strokeWidth={1}
          className="absolute right-6 top-6 text-[var(--accent)] opacity-[0.07]"
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.figure
            key={current.id}
            initial={reduced ? false : { opacity: 0, y: 24, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduced ? undefined : { opacity: 0, y: -16, filter: "blur(6px)" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative flex h-full flex-col justify-between gap-10"
          >
            <div>
              <div className="mb-8 flex gap-1 text-amber-400">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <blockquote className="text-xl font-light leading-snug tracking-tight text-[var(--foreground)] md:text-3xl">
                &ldquo;{current.quote}&rdquo;
              </blockquote>
            </div>

            <figcaption className="flex items-center gap-4 border-t border-[var(--border)] pt-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-hover)] font-mono text-xs font-bold text-[var(--accent)]">
                {initialsOf(current.clientName)}
              </span>
              <span>
                <span className="block text-sm font-medium text-[var(--foreground)]">
                  {current.clientName}
                </span>
                <span className="block font-mono text-xs text-[var(--muted)]">
                  {current.clientRole} ·{" "}
                  <span className="text-[var(--muted)]">
                    {current.clientCompany}
                  </span>
                </span>
              </span>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>

      {count > 1 && (
        <div className="mt-6 flex items-center justify-between gap-6">
          <div role="tablist" aria-label={labels.list} className="flex flex-1 gap-3">
            {testimonials.map((t, i) => {
              const on = i === index;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-label={t.clientName}
                  onClick={() => go(i)}
                  className="group flex-1 py-3 text-left"
                >
                  <span className="relative block h-px w-full overflow-hidden bg-[var(--border-hover)]">
                    {on && (
                      <motion.span
                        key={`${index}-${autoplay}`}
                        initial={{ scaleX: autoplay ? 0 : 1 }}
                        animate={{ scaleX: 1 }}
                        transition={{
                          duration: autoplay ? INTERVAL_MS / 1000 : 0.3,
                          ease: "linear",
                        }}
                        className="absolute inset-0 origin-left bg-[var(--accent)]"
                      />
                    )}
                  </span>
                  <span
                    className={`mt-3 block truncate font-mono text-[11px] uppercase tracking-wider transition-colors ${
                      on
                        ? "text-[var(--foreground)]"
                        : "text-[var(--muted)] group-hover:text-[var(--secondary)]"
                    }`}
                  >
                    {t.clientCompany || t.clientName}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              aria-label={labels.previous}
              onClick={() => go(index - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--secondary)] transition-colors hover:border-[var(--border-hover)] hover:text-[var(--foreground)]"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              aria-label={labels.next}
              onClick={() => go(index + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--secondary)] transition-colors hover:border-[var(--border-hover)] hover:text-[var(--foreground)]"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
