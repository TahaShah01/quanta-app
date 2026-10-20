import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { PageSection } from "@/components/layout/PageSection";
import { PageCta } from "@/components/layout/PageCta";
import { ProjectsList } from "@/components/projects/ProjectsList";
import { getPages, getProjects } from "@/lib/site";

export function generateMetadata(): Metadata {
  return getPages().projects.meta;
}

export default function ProjectsPage() {
  const projects = getProjects();
  const { projects: copy } = getPages();

  return (
    <>
      <PageHero
        eyebrow={copy.hero.eyebrow}
        shape="orbit"
        lines={copy.hero.lines}
        body={copy.hero.body}
        meta={`${String(projects.length).padStart(2, "0")} ${copy.hero.metaLabel ?? ""}`}
      />

      <PageSection>
        <ProjectsList initialProjects={projects} />
      </PageSection>

      <PageCta />
    </>
  );
}
