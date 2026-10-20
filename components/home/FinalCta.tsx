"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useReducedMotion } from "@/lib/experience/useReducedMotion";
import { Container } from "@/components/ui/Container";
import { Magnetic } from "@/components/ui/Magnetic";
import type { HomeContent } from "@/lib/home-types";

export function FinalCta({ content }: { content: HomeContent["cta"] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [0.86, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [0.15, 1]);
  const lift = useTransform(scrollYProgress, [0, 1], [60, 0]);

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden py-32 md:py-48"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundSize: "40px 40px",
            backgroundImage:
              "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
            maskImage:
              "radial-gradient(ellipse 60% 60% at 50% 50%, black, transparent)",
          }}
        />
        <div className="animate-scan pointer-events-none absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--foreground)] to-transparent opacity-10 will-change-transform" />
      </div>

      <Container>
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <motion.h2
            style={reduced ? undefined : { scale, opacity, y: lift }}
            className="text-hero mb-6 leading-tight"
          >
            {content.lines.map((line, i) => (
              <span key={i} className="block">
                {line.italic ? (
                  <span className="font-light italic opacity-90">{line.text}</span>
                ) : (
                  line.text
                )}
              </span>
            ))}
          </motion.h2>

          <p className="text-section mb-16 text-[var(--secondary)]">
            {content.subtitle}
          </p>

          <Magnetic strength={0.4}>
            <Link
              href={content.button.href}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[var(--accent)] px-8 py-4 text-base font-medium text-[var(--accent-foreground)] transition-all hover:bg-[var(--accent-hover)]"
            >
              {content.button.label}
              <ArrowUpRight
                size={20}
                className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
              />
            </Link>
          </Magnetic>
        </div>
      </Container>
    </div>
  );
}
