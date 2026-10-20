import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/home/SectionHeader";
import { TeamStrip } from "@/components/home/TeamStrip";
import type { HomeContent } from "@/lib/home-types";
import type { TeamMember } from "@/lib/types";

export function TeamTeaser({
  content,
  team,
}: {
  content: HomeContent["team"];
  team: TeamMember[];
}) {
  return (
    <div className="overflow-hidden py-24 md:py-32">
      <Container>
        <SectionHeader content={content} className="mb-14 md:mb-20" />
        <TeamStrip team={team} href={content.link?.href ?? "/team"} />
      </Container>
    </div>
  );
}
