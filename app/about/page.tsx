import type { Metadata } from "next";
import { FadeIn } from "@/components/animations/FadeIn";
import { TiltCard } from "@/components/animations/TiltCard";
import { PageHero } from "@/components/layout/PageHero";
import { PageSection } from "@/components/layout/PageSection";
import { PageCta } from "@/components/layout/PageCta";
import { Stats } from "@/components/home/Stats";
import { TechStack } from "@/components/home/TechStack";
import { getPages, getSettings, getSiteData } from "@/lib/site";

export function generateMetadata(): Metadata {
  return getPages().about.meta;
}

export default function AboutPage() {
  const { home, tech } = getSiteData();
  const { about } = getPages();
  const stats = (getSettings()?.stats ?? []).map((s) => ({
    value: s.number,
    label: s.label,
  }));

  return (
    <>
      <PageHero
        eyebrow={about.hero.eyebrow}
        shape="orbit"
        lines={about.hero.lines}
        body={about.hero.body}
      />

      <PageSection>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <FadeIn scroll>
              <h2 className="text-section leading-tight">{about.why.title}</h2>
            </FadeIn>
          </div>
          <div className="flex flex-col gap-6 lg:col-span-7">
            {about.why.paragraphs.map((text, i) => (
              <FadeIn key={i} delay={0.1 + i * 0.07} yOffset={15} scroll>
                <p className="text-body leading-relaxed">{text}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </PageSection>

      <PageSection
        header={{ eyebrow: about.values.eyebrow, title: about.values.title }}
      >
        <div className="grid grid-cols-1 gap-x-12 gap-y-14 md:grid-cols-2">
          {about.values.items.map((value, index) => (
            <FadeIn key={value.num} delay={0.05 + index * 0.08} yOffset={20} scroll>
              <div className="group flex flex-col">
                <div className="mb-4 flex items-center gap-4">
                  <span className="font-mono text-sm text-[var(--accent)]">
                    /{value.num}
                  </span>
                  <div className="h-px flex-1 bg-[var(--border)] transition-colors duration-500 group-hover:bg-[var(--accent)]/50" />
                </div>
                <h3 className="mb-3 text-xl font-medium text-[var(--foreground)]">
                  {value.title}
                </h3>
                <p className="text-body text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </PageSection>

      <PageSection
        header={{ eyebrow: about.process.eyebrow, title: about.process.title }}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {about.process.items.map((step, index) => (
            <FadeIn key={step.num} delay={0.05 + index * 0.1} yOffset={25} scroll className="h-full">
              <TiltCard className="group flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 transition-colors duration-500 hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]">
                <span className="mb-6 font-mono text-4xl font-light text-[var(--border-hover)] transition-colors duration-500 group-hover:text-[var(--accent)]">
                  {step.num}
                </span>
                <h3 className="mb-2 text-lg font-medium text-[var(--foreground)]">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--secondary)]">
                  {step.description}
                </p>
              </TiltCard>
            </FadeIn>
          ))}
        </div>
      </PageSection>

      <div className="border-t border-[var(--border)]">
        <TechStack content={home.techStack} tech={tech} />
      </div>
      {stats.length > 0 && <Stats items={stats} />}
      <PageCta />
    </>
  );
}
