"use client";

import { useRef } from "react";
import Image from "@/components/ui/SafeImage";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useReducedMotion } from "@/lib/experience/useReducedMotion";
import { useMediaQuery } from "@/lib/experience/useMediaQuery";

export interface StoryChapter {
  label: string;
  title: string;
  body: string;
}

export interface StoryStat {
  value: number;
  label: string;
  suffix?: string;
}

interface CaseStoryProps {
  num: string;
  chapters: StoryChapter[];
  stats: StoryStat[];
  technologies: string[];
  images: string[];
  year: string;
}

function Stat({ stat, progress }: { stat: StoryStat; progress: MotionValue<number> }) {
  const shown = useTransform(progress, (v) => Math.round(v * stat.value));
  return (
    <div className="flex flex-col gap-1 border-t border-[var(--border-hover)] pt-4">
      <span className="text-5xl font-light tabular-nums tracking-tighter text-[var(--foreground)]">
        <motion.span>{shown}</motion.span>
        {stat.suffix}
      </span>
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
        {stat.label}
      </span>
    </div>
  );
}

function Screen({
  index,
  count,
  chapter,
  progress,
  num,
  stats,
  technologies,
  image,
  year,
}: {
  index: number;
  count: number;
  chapter: StoryChapter;
  progress: MotionValue<number>;
  num: string;
  stats: StoryStat[];
  technologies: string[];
  image?: string;
  year: string;
}) {
  const start = index / count;
  const end = (index + 1) / count;
  const enter = useTransform(progress, [Math.max(0, start - 0.12), start + 0.05], [0, 1]);
  const x = useTransform(enter, [0, 1], index === 0 ? ["0%", "0%"] : ["110%", "0%"]);
  const next = Math.min(1, end + 0.1);
  const scale = useTransform(progress, [end - 0.02, next], [1, index === count - 1 ? 1 : 0.92]);
  const dim = useTransform(progress, [end - 0.02, next], [0, index === count - 1 ? 0 : 0.5]);
  const statProgress = useTransform(progress, [start + 0.05, end], [0, 1], { clamp: true });
  const isLast = index === count - 1;
  const isMiddle = index === 1;

  return (
    <motion.div
      style={{ x, scale, zIndex: index }}
      className="absolute inset-0 overflow-hidden rounded-3xl border border-[var(--border-hover)] bg-[var(--surface-hover)] shadow-2xl backdrop-blur-sm"
    >
      <div className="absolute inset-0 bg-[var(--background)]" />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundSize: "32px 32px",
          backgroundImage:
            "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)",
        }}
      />
      {image && <Image src={image} alt="" fill sizes="50vw" className="object-cover opacity-70" />}

      <div className="relative flex h-full flex-col justify-between p-8 md:p-10">
        <div className="flex items-center justify-between font-mono text-xs text-[var(--muted)]">
          <span>{chapter.label}</span>
          <span>{year}</span>
        </div>

        {isLast ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-8">
            {stats.map((s) => (
              <Stat key={s.label} stat={s} progress={statProgress} />
            ))}
          </div>
        ) : isMiddle ? (
          <ul className="flex flex-wrap gap-2">
            {technologies.map((t) => (
              <li
                key={t}
                className="rounded-full border border-[var(--border-hover)] px-3.5 py-1.5 font-mono text-xs text-[var(--secondary)]"
              >
                {t}
              </li>
            ))}
          </ul>
        ) : (
          <span className="select-none text-[clamp(6rem,16vw,14rem)] font-light leading-none tracking-tighter text-[var(--border-hover)]">
            {num}
          </span>
        )}

        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
          0{index + 1} / 0{count}
        </div>
      </div>
      <motion.div
        aria-hidden
        style={{ opacity: dim }}
        className="pointer-events-none absolute inset-0 bg-[var(--background)]"
      />
    </motion.div>
  );
}

function Copy({
  index,
  count,
  chapter,
  progress,
}: {
  index: number;
  count: number;
  chapter: StoryChapter;
  progress: MotionValue<number>;
}) {
  const start = index / count;
  const end = (index + 1) / count;
  const first = index === 0;
  const last = index === count - 1;
  // Scroll-linked ranges must stay inside 0..1 (and increase) or WAAPI rejects them.
  const range = [Math.max(0, start - 0.03), start + 0.06, end - 0.08, end];
  const opacity = useTransform(progress, range, [first ? 1 : 0, 1, 1, last ? 1 : 0]);
  const y = useTransform(progress, range, [first ? 0 : 40, 0, 0, last ? 0 : -40]);

  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex flex-col justify-center">
      <span className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
        {chapter.label}
      </span>
      <h2 className="text-section mb-6">{chapter.title}</h2>
      <p className="text-body">{chapter.body}</p>
    </motion.div>
  );
}

/**
 * Pinned, scroll-driven walkthrough of a project: problem, approach, result.
 * Without room or motion (phones, reduced motion) it becomes a normal article.
 */
export function CaseStory({ num, chapters, stats, technologies, images, year }: CaseStoryProps) {
  const reduced = useReducedMotion();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const count = chapters.length;

  if (reduced || !desktop) {
    return (
      <div className="flex flex-col gap-14">
        {chapters.map((c) => (
          <div key={c.label} className="flex flex-col gap-4">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              {c.label}
            </span>
            <h2 className="text-subsection">{c.title}</h2>
            <p className="text-body">{c.body}</p>
          </div>
        ))}
        {stats.length > 0 && (
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="border-t border-[var(--border-hover)] pt-4">
                <dd className="text-4xl font-light tabular-nums tracking-tighter">
                  {s.value}
                  {s.suffix}
                </dd>
                <dt className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} style={{ height: `${count * 120}vh` }} className="relative">
      <div className="sticky top-0 grid h-screen grid-cols-12 items-center gap-10 py-24">
        <div className="relative col-span-5 h-[60vh]">
          {chapters.map((c, i) => (
            <Copy key={c.label} index={i} count={count} chapter={c} progress={scrollYProgress} />
          ))}
          <div className="absolute -bottom-10 left-0 right-0 h-px bg-[var(--border)]">
            <motion.div style={{ scaleX: scrollYProgress }} className="h-px origin-left bg-[var(--foreground)]" />
          </div>
        </div>

        <div className="relative col-span-7 h-[64vh]">
          {chapters.map((c, i) => (
            <Screen
              key={c.label}
              index={i}
              count={count}
              chapter={c}
              progress={scrollYProgress}
              num={num}
              stats={stats}
              technologies={technologies}
              image={images[i]}
              year={year}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
