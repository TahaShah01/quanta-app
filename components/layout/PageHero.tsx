import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";
import { TextReveal } from "@/components/animations/TextReveal";
import { ExperienceSection } from "@/components/experience/ExperienceSection";
import type { ShapeId } from "@/lib/experience/store";
import type { HeroLine } from "@/lib/home-types";

interface PageHeroProps {
  eyebrow: string;
  lines: HeroLine[];
  body?: ReactNode;
  /** Shape the 3D scene morphs into while this page's hero is on screen */
  shape?: ShapeId;
  /** Buttons or links under the intro copy */
  actions?: ReactNode;
  /** Small mono label on the right, e.g. a count */
  meta?: ReactNode;
}

/** Shared page opener. Same type, spacing and motion as the homepage hero. */
export function PageHero({
  eyebrow,
  lines,
  body,
  shape = "drift",
  actions,
  meta,
}: PageHeroProps) {
  return (
    <ExperienceSection
      id="intro"
      label={eyebrow}
      shape={shape}
      offsetX={0.42}
      className="relative w-full overflow-hidden border-b border-[var(--border)] pb-20 pt-36 md:pb-28 md:pt-44"
    >
      <Container>
        <div className="flex items-end justify-between gap-8">
          <div className="flex max-w-3xl flex-col">
            <FadeIn delay={0.1}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
                {eyebrow}
              </div>
            </FadeIn>

            <h1 className="text-hero mb-8 flex flex-col">
              {lines.map((line, i) => (
                <TextReveal key={i} delay={0.2 + i * 0.1}>
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

            {body && (
              <FadeIn delay={0.2 + lines.length * 0.1} yOffset={10}>
                <div className="text-body max-w-lg">{body}</div>
              </FadeIn>
            )}

            {actions && (
              <FadeIn delay={0.3 + lines.length * 0.1} yOffset={10}>
                <div className="mt-10 flex flex-wrap items-center gap-6">
                  {actions}
                </div>
              </FadeIn>
            )}
          </div>

          {meta && (
            <FadeIn delay={0.6} yOffset={0} className="hidden md:block">
              <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--muted)]">
                {meta}
              </div>
            </FadeIn>
          )}
        </div>
      </Container>
    </ExperienceSection>
  );
}
