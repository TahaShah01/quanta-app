import { ExperienceSection } from "@/components/experience/ExperienceSection";
import { FinalCta } from "@/components/home/FinalCta";
import { getSiteData } from "@/lib/site";

/** Closing call to action shared by every page, wired to home.json. */
export function PageCta() {
  const { home } = getSiteData();

  return (
    <ExperienceSection
      id="contact"
      label={home.cta.navLabel}
      shape="singularity"
      offsetX={0}
      className="relative w-full border-t border-[var(--border)]"
    >
      <FinalCta content={home.cta} />
    </ExperienceSection>
  );
}
