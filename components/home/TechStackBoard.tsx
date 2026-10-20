"use client";

import { useRef } from "react";
import { motion, type Variants } from "framer-motion";
import type { TechCategory } from "@/lib/home-types";

const EASE = [0.22, 1, 0.36, 1] as const;

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};

const item: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } },
};

function TechCard({
  category,
  index,
  footnote,
}: {
  category: TechCategory;
  index: number;
  footnote?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Cursor-follow spotlight, driven by CSS variables (no React re-renders).
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: EASE }}
      className="group relative h-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 transition-colors duration-300 hover:border-[var(--border-hover)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(360px circle at var(--mx, 50%) var(--my, 50%), var(--accent-subtle), transparent 70%)",
        }}
      />

      <div className="relative flex h-full flex-col justify-between p-6 md:p-8">
        <div>
          <div className="mb-6 border-b border-[var(--border)] pb-3 font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
            {category.category}
          </div>

          <motion.ul
            variants={list}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            className="flex flex-col gap-3"
          >
            {category.items.map((tech) => (
              <motion.li
                key={tech.name}
                variants={item}
                className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)]/40 bg-[var(--surface)] p-2.5 transition-colors hover:border-[var(--accent)]/30"
              >
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {tech.name}
                </span>
                <span className="text-right font-mono text-xs text-[var(--muted)]">
                  {tech.role}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {footnote && (
          <div className="mt-6 border-t border-[var(--border)]/40 pt-4 font-mono text-[11px] text-[var(--muted)]">
            {footnote}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function TechStackBoard({
  categories,
  footnote,
}: {
  categories: TechCategory[];
  footnote?: string;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
        {categories.map((category, i) => (
          <TechCard
            key={category.category}
            category={category}
            index={i}
            footnote={footnote}
          />
        ))}
      </div>

    </>
  );
}
