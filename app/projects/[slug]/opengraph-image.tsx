import { getProjects } from "@/lib/site";
import { OG_SIZE, OG_TYPE, ogCard } from "@/lib/og";

export const alt = "Case study preview";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export async function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjects().find((p) => p.slug === slug);

  return ogCard({
    kicker: project ? `Case study / ${project.category}` : "Case study",
    title: project?.title ?? "Case study",
    description: project?.description,
    footerLeft: project
      ? [project.year, ...project.technologies.slice(0, 4)].filter(Boolean).join("  ·  ")
      : undefined,
  });
}
