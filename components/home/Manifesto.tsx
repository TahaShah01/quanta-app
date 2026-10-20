"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useReducedMotion } from "@/lib/experience/useReducedMotion";
import { Container } from "@/components/ui/Container";
import {
  ConvergenceDiagram,
  type DiagramNode,
} from "@/components/home/ConvergenceDiagram";
import type { HomeContent } from "@/lib/home-types";

function Word({
  word,
  progress,
  range,
  reduced,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
  reduced: boolean;
}) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span
      style={reduced ? undefined : { opacity }}
      className="inline-block"
    >
      {word}
    </motion.span>
  );
}

/**
 * Pinned statement. The words light up as you scroll while the disciplines on
 * the right converge into one ring: the sentence and the picture say the same
 * thing at the same pace.
 */
export function Manifesto({
  content,
  nodes,
}: {
  content: HomeContent["manifesto"];
  nodes: DiagramNode[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const settled = useMotionValue(1);
  const progress = reduced ? settled : scrollYProgress;

  const words = content.text.split(/\s+/).filter(Boolean);

  return (
    <div ref={ref} className={reduced ? "py-24 md:py-32" : "relative h-[260vh]"}>
      <div
        className={reduced ? "" : "sticky top-0 flex h-screen items-center"}
      >
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
                {content.eyebrow}
              </div>
              <p className="flex flex-wrap gap-x-[0.28em] text-[clamp(1.75rem,6vw,2.75rem)] font-medium leading-[1.15] tracking-tight text-[var(--foreground)] lg:text-[clamp(1.6rem,3vw,3.1rem)]">
                {words.map((word, i) => {
                  const start = 0.08 + (i / words.length) * 0.68;
                  return (
                    <Word
                      key={`${word}-${i}`}
                      word={word}
                      progress={progress}
                      range={[start, Math.min(start + 0.1, 1)]}
                      reduced={reduced}
                    />
                  );
                })}
              </p>
            </div>

            {nodes.length > 0 && (
              <div className="hidden lg:col-span-5 lg:block">
                <ConvergenceDiagram
                  nodes={nodes}
                  progress={progress}
                  center={content.diagramCenter}
                  caption={content.diagramCaption}
                />
              </div>
            )}
          </div>
        </Container>
      </div>
    </div>
  );
}
