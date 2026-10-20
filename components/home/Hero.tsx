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
import { FadeIn } from "@/components/animations/FadeIn";
import { TextReveal } from "@/components/animations/TextReveal";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { Magnetic } from "@/components/ui/Magnetic";
import { SystemGraphic } from "@/components/home/SystemGraphic";
import { HeroStage } from "@/components/experience/HeroStage";
import type { HomeContent } from "@/lib/home-types";

interface HeroProps {
  content: HomeContent["hero"];
  scrollHint: string;
}

export function Hero({ content, scrollHint }: HeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <div
      ref={ref}
      className="relative flex min-h-[100svh] w-full flex-col justify-center overflow-hidden pb-24 pt-32 lg:min-h-[90vh] lg:pt-24"
    >
      <Container className="z-10 grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-8">
        <motion.div
          style={reduced ? undefined : { y, opacity }}
          className="flex flex-col justify-center"
        >
          <FadeIn delay={0.2} yOffset={10}>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="text-label inline-block">{content.eyebrow}</span>
              <AvailabilityBadge showLink={true} />
            </div>
          </FadeIn>

          <h1 className="text-hero mb-8 flex flex-col">
            {content.lines.map((line, i) => (
              <TextReveal key={i} delay={0.4 + i * 0.1}>
                {line.italic ? (
                  <span className="pr-2 font-light italic opacity-90">
                    {line.text}
                  </span>
                ) : (
                  line.text
                )}
              </TextReveal>
            ))}
          </h1>

          <FadeIn delay={0.8} yOffset={10}>
            <p className="text-body mb-10 max-w-md">{content.body}</p>
          </FadeIn>

          <FadeIn delay={1.0} yOffset={10}>
            <div className="flex flex-wrap items-center gap-6">
              <Magnetic>
                <Link
                  href={content.primaryCta.href}
                  className="group flex items-center gap-2 rounded-full border border-transparent bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-foreground)] shadow-md transition-all duration-300 hover:brightness-110 hover:shadow-[var(--accent)]/20"
                >
                  {content.primaryCta.label}
                  <ArrowUpRight
                    size={16}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>
              </Magnetic>
              <Link
                href={content.secondaryCta.href}
                className="group relative flex items-center gap-1 text-sm font-medium text-[var(--secondary)] transition-colors duration-300 after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-[var(--foreground)] after:transition-all after:duration-300 hover:text-[var(--foreground)] hover:after:w-full"
              >
                {content.secondaryCta.label}
              </Link>
            </div>
          </FadeIn>
        </motion.div>

        <div className="flex items-center justify-center lg:justify-end">
          <HeroStage fallback={<SystemGraphic />} />
        </div>
      </Container>

      {!reduced && (
        <FadeIn delay={1.6} yOffset={0} className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center md:flex">
          <div className="flex flex-col items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--muted)]">
            {scrollHint}
            <span className="relative block h-10 w-px overflow-hidden bg-[var(--border-hover)]">
              <motion.span
                className="absolute inset-x-0 top-0 block h-1/2 bg-[var(--foreground)]"
                animate={{ y: ["-100%", "200%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
