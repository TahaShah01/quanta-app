import { WorkShowcase, type WorkMember } from "@/components/home/WorkShowcase";
import type { HomeContent } from "@/lib/home-types";
import type { Project, TeamMember } from "@/lib/types";

export function SelectedWork({
  content,
  projects,
  team,
}: {
  content: HomeContent["work"];
  projects: Project[];
  team: TeamMember[];
}) {
  const members: WorkMember[] = team.map((m) => ({
    id: m.id,
    name: m.name,
    initials: m.initials || m.name.slice(0, 2).toUpperCase(),
  }));

  return <WorkShowcase content={content} projects={projects} members={members} />;
}
