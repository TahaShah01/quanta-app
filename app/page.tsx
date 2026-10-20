import { getFeatures, getSiteData } from "@/lib/site";
import { HomeExperience } from "@/components/experience/HomeExperience";
import { ExperienceSection } from "@/components/experience/ExperienceSection";
import { Hero } from "@/components/home/Hero";
import { VelocityMarquee } from "@/components/home/VelocityMarquee";
import { Manifesto } from "@/components/home/Manifesto";
import { Stats } from "@/components/home/Stats";
import { Capabilities } from "@/components/home/Capabilities";
import { TechStack } from "@/components/home/TechStack";
import { SelectedWork } from "@/components/home/SelectedWork";
import { Testimonials } from "@/components/home/Testimonials";
import { ClientsWall } from "@/components/home/ClientsWall";
import { TeamTeaser } from "@/components/home/TeamTeaser";
import { FinalCta } from "@/components/home/FinalCta";

export default function Home() {
  const {
    services,
    featuredProjects,
    testimonials,
    team,
    clients,
    home,
    tech,
    nodes,
  } = getSiteData();

  const showClients = getFeatures().clientsOnHome && clients.length > 0;

  const sectionClass = "relative w-full";
  const bordered = `${sectionClass} border-t border-[var(--border)]`;

  return (
    <HomeExperience
      nodes={nodes}
      railLabel={home.ui.railLabel}
      preloader={home.preloader}
    >
      <ExperienceSection
        id="intro"
        label={home.hero.navLabel}
        shape="nexus"
        className={sectionClass}
      >
        <Hero content={home.hero} scrollHint={home.ui.scrollHint} />
      </ExperienceSection>

      <VelocityMarquee items={services.map((s) => s.title)} />

      <ExperienceSection
        id="approach"
        label={home.manifesto.navLabel}
        shape="drift"
        className={sectionClass}
      >
        <Manifesto content={home.manifesto} nodes={nodes} />
        <Stats items={home.stats.items} />
      </ExperienceSection>

      {services.length > 0 && (
        <ExperienceSection
          id="capabilities"
          label={home.capabilities.navLabel}
          shape="stack"
          className={bordered}
        >
          <Capabilities content={home.capabilities} services={services} />
        </ExperienceSection>
      )}

      {tech.categories.length > 0 && (
        <ExperienceSection
          id="stack"
          label={home.techStack.navLabel}
          shape="lattice"
          className={bordered}
        >
          <TechStack content={home.techStack} tech={tech} />
        </ExperienceSection>
      )}

      {featuredProjects.length > 0 && (
        <ExperienceSection
          id="work"
          label={home.work.navLabel}
          shape="orbit"
          className={bordered}
        >
          <SelectedWork
            content={home.work}
            projects={featuredProjects}
            team={team}
          />
        </ExperienceSection>
      )}

      {showClients && (
        <ExperienceSection
          id="working-with"
          label={home.clients.navLabel}
          shape="lattice"
          className={bordered}
        >
          <ClientsWall content={home.clients} ui={home.ui} clients={clients} />
        </ExperienceSection>
      )}

      {testimonials.length > 0 && (
        <ExperienceSection
          id="clients"
          label={home.testimonials.navLabel}
          shape="drift"
          className={bordered}
        >
          <Testimonials
            content={home.testimonials}
            ui={home.ui}
            testimonials={testimonials}
          />
        </ExperienceSection>
      )}

      {team.length > 0 && (
        <ExperienceSection
          id="team"
          label={home.team.navLabel}
          shape="crew"
          className={bordered}
        >
          <TeamTeaser content={home.team} team={team} />
        </ExperienceSection>
      )}

      <ExperienceSection
        id="contact"
        label={home.cta.navLabel}
        shape="singularity"
        className={bordered}
      >
        <FinalCta content={home.cta} />
      </ExperienceSection>
    </HomeExperience>
  );
}
