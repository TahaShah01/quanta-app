import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Code,
  Database,
  Monitor,
  Pen,
  Rocket,
  Server,
  Shield,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { TiltCard } from "@/components/animations/TiltCard";
import { PageHero } from "@/components/layout/PageHero";
import { PageSection } from "@/components/layout/PageSection";
import { PageCta } from "@/components/layout/PageCta";
import { getPages, getServices } from "@/lib/site";

export function generateMetadata(): Metadata {
  return getPages().services.meta;
}

const iconMap: Record<string, LucideIcon> = {
  Monitor,
  Pen,
  Server,
  CheckCircle: CheckCircle2,
  Rocket,
  Code,
  Database,
  Shield,
  Zap,
};

export default function ServicesPage() {
  const services = getServices();
  const { services: copy } = getPages();

  return (
    <>
      <PageHero
        eyebrow={copy.hero.eyebrow}
        shape="stack"
        lines={copy.hero.lines}
        body={copy.hero.body}
        meta={`${String(services.length).padStart(2, "0")} ${copy.hero.metaLabel ?? ""}`}
      />

      <PageSection bordered={false}>
        <div className="flex flex-col gap-8 md:gap-10">
          {services.map((service, index) => {
            const Icon = iconMap[service.icon] || Code;
            const num = service.num || String(index + 1).padStart(2, "0");

            return (
              <FadeIn key={service.id} yOffset={30} scroll>
                <article data-scene-hover className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 transition-colors duration-500 hover:border-[var(--border-hover)] md:p-12">
                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
                    <div className="flex flex-col gap-4 lg:col-span-5">
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm tracking-wider text-[var(--accent)]">
                          /{num}
                        </span>
                        <span className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-2.5 text-[var(--foreground)]">
                          <Icon size={20} />
                        </span>
                      </div>
                      <h2 className="text-subsection mt-2">{service.title}</h2>
                      <p className="text-body text-base">
                        {service.description || service.shortDesc}
                      </p>
                    </div>

                    <div className="flex flex-col justify-between lg:col-span-7 lg:border-l lg:border-[var(--border)] lg:pl-12">
                      <div>
                        <div className="text-label mb-5">
                          {copy.deliverablesLabel}
                        </div>
                        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {(service.features || []).map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--foreground)]"
                            >
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-8 flex items-center justify-end border-t border-[var(--border)] pt-6">
                        <Link
                          href="/contact"
                          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[var(--foreground)] transition-colors hover:text-[var(--accent)]"
                        >
                          {copy.askLabel}
                          <ArrowUpRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </PageSection>

      <PageSection
        header={copy.framework}
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {copy.framework.items.map((phase, i) => (
            <FadeIn key={phase.step} delay={i * 0.08} yOffset={20} scroll className="h-full">
              <TiltCard className="flex h-full flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="font-mono text-sm text-[var(--accent)]">/{phase.step}</div>
                <div className="text-base font-medium text-[var(--foreground)]">{phase.name}</div>
                <p className="text-sm leading-relaxed text-[var(--secondary)]">{phase.desc}</p>
              </TiltCard>
            </FadeIn>
          ))}
        </div>
      </PageSection>

      <PageCta />
    </>
  );
}
