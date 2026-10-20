"use client";

import { ReactNode, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useReducedMotion } from "@/lib/experience/useReducedMotion";
import { useMediaQuery } from "@/lib/experience/useMediaQuery";
import { ServiceMotif } from "@/components/home/CapabilityMotifs";
import type { Service } from "@/lib/types";

type Mode = "stack" | "flow";

/** How far each stuck panel peeks out above the next one, in px. */
const PEEK = 18;

function CapabilityCard({
  service,
  index,
  count,
  container,
  mode,
  animated,
}: {
  service: Service;
  index: number;
  count: number;
  container: MotionValue<number>;
  mode: Mode;
  animated: boolean;
}) {
  const wrapRef = useRef<HTMLLIElement>(null);
  const settled = useMotionValue(1);
  const stacked = mode === "stack";

  // 0 -> 1 while this panel travels from below the fold to its resting place.
  const { scrollYProgress: enter } = useScroll({
    target: wrapRef,
    offset: ["start end", stacked ? "start 35%" : "start 60%"],
  });

  const x = useTransform(enter, [0, 1], [stacked ? 110 : 0, 0]);
  const rotate = useTransform(enter, [0, 1], [stacked ? 3 : 0, 0]);
  const opacity = useTransform(enter, [0, 0.5], [0, 1]);

  // Once stuck, each panel recedes a little as the next one lands on it.
  const range: [number, number] = [index / count, 1];
  const scale = useTransform(container, range, [
    1,
    stacked ? 1 - (count - 1 - index) * 0.04 : 1,
  ]);
  const dim = useTransform(container, range, [
    0,
    stacked && index < count - 1 ? 0.55 : 0,
  ]);

  const motifProgress = animated ? enter : settled;
  const features = (service.features ?? []).slice(0, 6);

  return (
    <li
      ref={wrapRef}
      data-scene-hover
      className={stacked ? "sticky top-24 h-[86vh] list-none" : "list-none"}
    >
      <motion.div
        style={
          animated
            ? {
                x,
                rotate,
                opacity,
                scale,
                top: stacked ? index * PEEK : undefined,
                transformOrigin: "50% 0%",
              }
            : { top: stacked ? index * PEEK : undefined }
        }
        className={`relative overflow-hidden rounded-[28px] border border-[var(--border-hover)] bg-[var(--background)] ${
          stacked ? "h-[min(74vh,600px)] min-h-[500px]" : ""
        }`}
      >
        <div aria-hidden className="absolute inset-0 bg-[var(--surface)]" />

        <div
          aria-hidden
          className="pointer-events-none absolute right-4 top-4 h-28 w-28 text-[var(--foreground)] sm:h-40 sm:w-40 md:right-8 md:top-8 md:h-56 md:w-56"
        >
          <ServiceMotif icon={service.icon} index={index} p={motifProgress} animated={animated} />
        </div>

        <div className="relative flex h-full flex-col p-6 md:p-10">
          <span className="font-mono text-sm text-[var(--muted)]">
            {service.num || String(index + 1).padStart(2, "0")}
          </span>

          <h3 className="mt-14 max-w-[11ch] sm:max-w-[15ch] text-[clamp(2rem,3.4vw,3.4rem)] font-medium leading-[1.04] tracking-tight text-[var(--foreground)] md:mt-10 md:max-w-[58%]">
            {service.title}
          </h3>
          <p className="mt-4 max-w-md text-base text-[var(--secondary)]">
            {service.shortDesc}
          </p>

          <div className="mt-auto grid gap-6 border-t border-[var(--border)] pt-6 md:grid-cols-2 md:gap-8 md:pt-8">
            <p className="text-sm leading-relaxed text-[var(--secondary)]">
              {service.description}
            </p>
            <ul className="flex flex-col gap-2">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 text-sm leading-snug text-[var(--foreground)]"
                >
                  <span className="mt-[0.5em] block h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <motion.div
          aria-hidden
          style={{ opacity: dim }}
          className="pointer-events-none absolute inset-0 z-20 bg-[var(--background)]"
        />
      </motion.div>
    </li>
  );
}

/**
 * Left: the sticky header you already liked. Right (desktop): panels that
 * slide in and stack on top of each other as you scroll. Mobile and reduced
 * motion get a plain vertical list.
 */
export function CapabilityShowcase({
  header,
  services,
}: {
  header: ReactNode;
  services: Service[];
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const reduced = useReducedMotion() ?? false;
  const mode: Mode = isDesktop && !reduced ? "stack" : "flow";
  const count = services.length;
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setActive(Math.min(count - 1, Math.max(0, Math.floor(p * count))));
  });

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
      <div className="self-start lg:sticky lg:top-32 lg:col-span-5">
        {header}

        {mode === "stack" && count > 1 && (
          <div className="mt-12 flex items-center gap-4 font-mono text-xs text-[var(--muted)]">
            <span className="tabular-nums text-[var(--foreground)]">
              {String(active + 1).padStart(2, "0")}
            </span>
            <span className="relative block h-px w-40 bg-[var(--border-hover)]">
              <motion.span
                style={{ scaleX: scrollYProgress }}
                className="absolute inset-0 origin-left bg-[var(--accent)]"
              />
            </span>
            <span className="tabular-nums">{String(count).padStart(2, "0")}</span>
          </div>
        )}
      </div>

      <ul
        ref={listRef}
        className={`lg:col-span-7 ${mode === "flow" ? "flex flex-col gap-6" : ""}`}
      >
        {services.map((service, i) => (
          <CapabilityCard
            key={`${service.id}-${mode}`}
            service={service}
            index={i}
            count={count}
            container={scrollYProgress}
            mode={mode}
            animated={!reduced}
          />
        ))}
      </ul>
    </div>
  );
}
