"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { useReducedMotion } from "@/lib/experience/useReducedMotion";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/home/SectionHeader";
import { ProjectVisual } from "@/components/home/ProjectVisual";
import { useMediaQuery } from "@/lib/experience/useMediaQuery";
import type { HomeContent } from "@/lib/home-types";
import type { Project } from "@/lib/types";

export interface WorkMember {
  id: string;
  name: string;
  initials: string;
}

interface WorkShowcaseProps {
  content: HomeContent["work"];
  projects: Project[];
  members: WorkMember[];
}

const gutter =
  "px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 2xl:px-24";

function WorkCard({
  project,
  index,
  members,
  cta,
  className = "",
}: {
  project: Project;
  index: number;
  members: WorkMember[];
  cta: string;
  className?: string;
}) {
  const team = (project.teamMembers ?? [])
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is WorkMember => Boolean(m));

  return (
    <Link
      href={`/projects/${project.slug}`}
      data-cursor="View"
      data-scene-hover
      data-transition-label={project.title}
      className={`group block ${className}`}
    >
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-colors duration-500 hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] lg:flex-row">
        <div className="relative z-10 order-2 flex min-h-[300px] w-full flex-col justify-between border-t border-[var(--border)] p-6 md:p-10 lg:order-1 lg:w-5/12 lg:border-r lg:border-t-0">
          <div className="flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-mono text-xs text-[var(--muted)] transition-colors group-hover:text-[var(--accent)]">
                /{project.num || String(index + 1).padStart(2, "0")}
              </span>
              <span className="rounded-full border border-[var(--border)] px-2 py-0.5 font-mono text-[11px] text-[var(--muted)]">
                {project.category}
              </span>
            </div>

            <h3 className="mb-4 text-2xl font-medium tracking-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)] md:text-3xl">
              {project.title}
            </h3>

            <p className="text-body mb-6 max-w-sm text-sm leading-relaxed">
              {project.description}
            </p>

            <div className="mb-6 flex flex-wrap gap-2">
              {(project.technologies ?? []).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--secondary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--foreground)] group-hover:text-[var(--accent)]">
              {cta}
              <ArrowUpRight
                size={15}
                className="opacity-70 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:opacity-100"
              />
            </span>

            {team.length > 0 && (
              <span className="flex -space-x-2">
                {team.map((m) => (
                  <span
                    key={m.id}
                    title={m.name}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-hover)] bg-[var(--background)] font-mono text-[11px] font-bold text-[var(--secondary)]"
                  >
                    {m.initials}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        <div className="relative order-1 aspect-video min-h-[240px] w-full overflow-hidden lg:order-2 lg:aspect-auto lg:w-7/12">
          <ProjectVisual
            type={project.visualType}
            images={project.images}
            title={project.title}
          />
        </div>
      </article>
    </Link>
  );
}

/** Desktop: the section pins and the cards travel sideways as you scroll down. */
function PinnedTrack({ content, projects, members }: WorkShowcaseProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const distRef = useRef(0);
  const [dist, setDist] = useState(0);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, (p) => -p * distRef.current);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setActive(
      Math.min(projects.length - 1, Math.round(p * (projects.length - 1)))
    );
  });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const d = Math.max(0, track.scrollWidth - window.innerWidth);
      distRef.current = d;
      setDist(d);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [projects.length]);

  return (
    <div ref={outerRef} style={{ height: `calc(100vh + ${dist}px)` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center gap-8 overflow-hidden pt-20">
        <div className={`flex items-end justify-between gap-6 ${gutter}`}>
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
              {content.eyebrow}
            </div>
            <h2 className="text-section leading-tight">
              {content.title.join(" ")}
            </h2>
          </div>
          <div className="flex items-center gap-8">
            <span className="font-mono text-xs tabular-nums text-[var(--muted)]">
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(projects.length).padStart(2, "0")}
            </span>
            {content.link && (
              <Link
                href={content.link.href}
                className="group inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:text-[var(--accent)]"
              >
                {content.link.label}
                <ArrowUpRight
                  size={16}
                  className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                />
              </Link>
            )}
          </div>
        </div>

        <motion.div
          ref={trackRef}
          style={{ x }}
          className={`flex w-max gap-8 will-change-transform ${gutter}`}
        >
          {projects.map((project, i) => (
            <WorkCard
              key={project.id}
              project={project}
              index={i}
              members={members}
              cta={content.cardCta}
              className="h-[min(60vh,600px)] w-[min(82vw,1080px)] shrink-0"
            />
          ))}
        </motion.div>

        <div className={gutter}>
          <div className="h-px w-full bg-[var(--border)]">
            <motion.div
              style={{ scaleX: scrollYProgress }}
              className="h-px origin-left bg-[var(--accent)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mobile / reduced motion: a plain vertical stack. */
function StackedList({ content, projects, members }: WorkShowcaseProps) {
  return (
    <div className="py-24 md:py-32">
      <Container>
        <SectionHeader content={content} className="mb-12 md:mb-16" />
        <div className="flex flex-col gap-8 md:gap-12">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <WorkCard
                project={project}
                index={i}
                members={members}
                cta={content.cardCta}
              />
            </motion.div>
          ))}
        </div>
      </Container>
    </div>
  );
}

export function WorkShowcase(props: WorkShowcaseProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const reduced = useReducedMotion();

  if (props.projects.length === 0) return null;

  return isDesktop && !reduced ? (
    <PinnedTrack {...props} />
  ) : (
    <StackedList {...props} />
  );
}
