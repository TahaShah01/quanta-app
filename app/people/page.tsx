import type { Metadata } from "next";
import Image from "@/components/ui/SafeImage";
import { FadeIn } from "@/components/animations/FadeIn";
import { ImageReveal } from "@/components/animations/ImageReveal";
import { PartnersSection } from "@/components/people/PartnersSection";
import { PageHero } from "@/components/layout/PageHero";
import { PageSection } from "@/components/layout/PageSection";
import { PageCta } from "@/components/layout/PageCta";
import { ExperienceSection } from "@/components/experience/ExperienceSection";
import { ClientsWall } from "@/components/home/ClientsWall";
import { getClients, getHomeCopy, getPages, getPartners, getTeam } from "@/lib/site";
import { getSocialLinks } from "@/lib/socials";

export function generateMetadata(): Metadata {
  return getPages().people.meta;
}

export default function PeoplePage() {
  const team = getTeam();
  const partners = getPartners();
  const clients = getClients();
  const home = getHomeCopy();
  const { people } = getPages();

  return (
    <>
      <PageHero
        eyebrow={people.hero.eyebrow}
        shape="crew"
        lines={people.hero.lines}
        body={people.hero.body}
        meta={`${String(team.length).padStart(2, "0")} ${people.hero.metaLabel ?? ""}`}
      />

      <PageSection bordered={false}>
        <div className="flex flex-col gap-28 md:gap-40">
          {team.map((member, index) => {
            const isEven = index % 2 === 0;
            const links = getSocialLinks(member.socialLinks);

            return (
              <FadeIn key={member.id} delay={0.1} yOffset={30} scroll>
                <article
                  data-scene-hover
                  className={`group flex flex-col items-center gap-8 md:gap-20 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  <ImageReveal className="aspect-[3/4] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition-colors duration-700 group-hover:border-[var(--accent)]/50 md:w-5/12">
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="absolute inset-0 opacity-20 transition-opacity duration-700 group-hover:opacity-35"
                          style={{
                            background: `radial-gradient(circle at ${
                              isEven ? "30% 70%" : "70% 30%"
                            }, var(--accent) 0%, transparent 70%)`,
                          }}
                        />
                        <span className="z-10 font-mono text-7xl font-bold text-[var(--border-hover)] transition-all duration-700 ease-out group-hover:scale-110 group-hover:text-[var(--accent)] md:text-8xl">
                          {member.initials || member.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div
                          className="pointer-events-none absolute inset-0 opacity-[0.05]"
                          style={{
                            backgroundSize: "16px 16px",
                            backgroundImage:
                              "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
                          }}
                        />
                      </div>
                    )}
                  </ImageReveal>

                  <div
                    className={`z-10 flex w-full flex-col md:w-6/12 ${
                      isEven ? "md:mt-16" : "md:-mt-16"
                    }`}
                  >
                    <div className="mb-6 flex items-start gap-5 border-b border-[var(--border)] pb-6">
                      <span className="pt-3 font-mono text-xs text-[var(--accent)]">
                        /{member.num || String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h2 className="text-subsection mb-2 transition-colors duration-300 group-hover:text-[var(--accent)]">
                          {member.name}
                        </h2>
                        <span className="font-light italic text-[var(--secondary)]">
                          {member.role}
                        </span>
                      </div>
                    </div>

                    <div className="md:pl-8">
                      <p className="text-body mb-8 text-base">{member.shortBio}</p>

                      <div className="mb-8 flex flex-col">
                        <span className="text-label mb-3">{people.expertiseLabel}</span>
                        <ul className="flex flex-wrap gap-2">
                          {(member.expertise || []).map((skill) => (
                            <li
                              key={skill}
                              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 font-mono text-xs text-[var(--secondary)] transition-colors duration-300 group-hover:border-[var(--border-hover)]"
                            >
                              {skill}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {links.length > 0 && (
                        <div className="flex items-center gap-4 border-t border-[var(--border)] pt-4 text-[var(--secondary)]">
                          <span className="text-label mr-2">{people.connectLabel}</span>
                          {links.map(({ key, label, href, Icon }) => (
                            <a
                              key={key}
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${member.name} on ${label}`}
                              className="transition-colors hover:text-[var(--accent)]"
                            >
                              <Icon size={16} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </PageSection>

      {partners.length > 0 && (
        <PartnersSection partners={partners} content={people.partners} />
      )}

      {clients.length > 0 && (
        <ExperienceSection id="working-with" label={home.clients.navLabel} shape="lattice" offsetX={0.42}>
          <ClientsWall content={home.clients} ui={home.ui} clients={clients} />
        </ExperienceSection>
      )}

      <PageCta />
    </>
  );
}
