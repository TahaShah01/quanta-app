import Image from "@/components/ui/SafeImage";
import { ArrowUpRight, Building2, UserRound } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { TiltCard } from "@/components/animations/TiltCard";
import { ExperienceSection } from "@/components/experience/ExperienceSection";
import { PageSection } from "@/components/layout/PageSection";
import type { PagesContent } from "@/lib/pages-types";
import { safeHref } from "@/lib/url";
import type { Partner } from "@/lib/types";

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/** People and companies the studio works with. Shown only when enabled and non-empty. */
export function PartnersSection({
  partners,
  content,
}: {
  partners: Partner[];
  content: PagesContent["people"]["partners"];
}) {
  return (
    <ExperienceSection id="partners" label={content.navLabel} shape="lattice" offsetX={0.42}>
      <PageSection header={content}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {partners.map((partner, i) => {
            const href = safeHref(partner.website);
            const KindIcon = partner.kind === "company" ? Building2 : UserRound;
            const card = (
              <TiltCard className="h-full rounded-2xl">
                <div
                  data-scene-hover
                  className="group relative flex h-full flex-col gap-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 transition-colors duration-500 hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border-hover)] bg-[var(--surface-hover)]">
                      <span className="font-mono text-lg text-[var(--secondary)] transition-colors duration-500 group-hover:text-[var(--foreground)]">
                        {initialsOf(partner.name)}
                      </span>
                      <Image
                        src={partner.logo}
                        alt={partner.name}
                        fill
                        sizes="64px"
                        className="bg-[var(--surface-hover)] object-cover"
                      />
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-[var(--muted)]">
                      <KindIcon size={11} />
                      {partner.kind === "company" ? "Company" : "Individual"}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
                    <h3 className="text-xl font-medium text-[var(--foreground)]">{partner.name}</h3>
                    <p className="font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
                      {partner.role}
                    </p>
                    {partner.description && (
                      <p className="mt-2 text-sm leading-relaxed text-[var(--secondary)]">
                        {partner.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 font-mono text-[11px] text-[var(--muted)]">
                    <span>
                      {partner.since ? `${content.sinceLabel} ${partner.since}` : ""}
                    </span>
                    {href && (
                      <span className="inline-flex items-center gap-1 text-[var(--secondary)] transition-colors group-hover:text-[var(--foreground)]">
                        {content.visitLabel}
                        <ArrowUpRight size={12} />
                      </span>
                    )}
                  </div>
                </div>
              </TiltCard>
            );

            return (
              <FadeIn key={partner.id} delay={i * 0.06} yOffset={20} scroll className="h-full">
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full"
                    aria-label={`${partner.name} (opens in a new tab)`}
                  >
                    {card}
                  </a>
                ) : (
                  card
                )}
              </FadeIn>
            );
          })}
        </div>
      </PageSection>
    </ExperienceSection>
  );
}
