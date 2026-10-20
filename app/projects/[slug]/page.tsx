import type { Metadata } from "next";
import Link from "next/link";
import Image from "@/components/ui/SafeImage";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";
import { PageHero } from "@/components/layout/PageHero";
import { PageCta } from "@/components/layout/PageCta";
import { CaseStory, type StoryChapter, type StoryStat } from "@/components/projects/CaseStory";
import { ImageReveal } from "@/components/animations/ImageReveal";
import { getBrand, getPages, getProjects, getTeam, getTestimonials } from "@/lib/site";
import { Magnetic } from "@/components/ui/Magnetic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjects().find((p) => p.slug === slug);
  if (!project) return { title: getPages().projectDetail.notFoundTitle };

  return {
    title: `${project.title} | ${getBrand()}`,
    description: project.description,
    openGraph: {
      title: `${project.title} | ${getBrand()}`,
      description: project.description,
      type: "article",
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;

  const project = getProjects().find((p) => p.slug === slug);
  if (!project) notFound();

  const assignedTeam = getTeam().filter((m) =>
    (project.teamMembers || []).includes(m.id)
  );
  const { projectDetail: t } = getPages();
  const testimonial = getTestimonials().find((t) => t.projectId === project.id);

  const bodies = [
    project.overview || project.description,
    project.approach,
    project.outcome,
  ];
  const chapters: StoryChapter[] = t.chapters.map((c, i) => ({
    label: c.label,
    title: c.title,
    body: bodies[i] || c.fallback,
  }));

  const parsedResults = (project.results || []).flatMap<StoryStat>((r) => {
    const m = r.match(/^(\d+(?:\.\d+)?)\s*(%|x|\+)?\s*(.*)$/i);
    return m ? [{ value: Number(m[1]), suffix: m[2] ?? "", label: m[3] || t.statLabels.result }] : [];
  });
  const stats: StoryStat[] =
    parsedResults.length > 0
      ? parsedResults.slice(0, 4)
      : [
          { value: (project.technologies || []).length, label: t.statLabels.technologies },
          { value: assignedTeam.length, label: t.statLabels.people },
          { value: Number(project.year) || 2026, label: t.statLabels.shipped },
        ].filter((s) => s.value > 0);

  const cover = project.images?.[0];

  return (
    <>
      <PageHero
        eyebrow={`/${project.num || "01"} · ${project.category}`}
        shape="orbit"
        lines={[{ text: project.title }]}
        body={project.description}
        meta={project.year || "2026"}
        actions={
          <>
            <Link
              href="/projects"
              className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[var(--secondary)] transition-colors hover:text-[var(--foreground)]"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
              {t.backLabel}
            </Link>
            {project.liveUrl && (
              <Magnetic strength={0.2}>
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-foreground)] shadow-md transition-all hover:brightness-110"
                >
                  {t.liveLabel}
                  <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </Magnetic>
            )}
          </>
        }
      />

      {cover && (
        <section className="w-full border-b border-[var(--border)] py-12 md:py-20">
          <Container>
            <ImageReveal className="aspect-[16/9] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
              <Image src={cover} alt={project.title} fill className="object-cover" />
            </ImageReveal>
          </Container>
        </section>
      )}

      <section className="w-full border-b border-[var(--border)] py-16 md:py-24">
        <Container>
          <CaseStory
            num={project.num || "01"}
            chapters={chapters}
            stats={stats}
            technologies={project.technologies || []}
            images={project.images || []}
            year={project.year || "2026"}
          />
        </Container>
      </section>

      <section className="w-full border-b border-[var(--border)] py-20 md:py-28">
        <Container>
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-24">
            <div className="lg:col-span-7">
              {testimonial ? (
                <FadeIn yOffset={15} scroll>
                  <figure className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 md:p-10">
                    <blockquote className="mb-6 text-lg italic leading-relaxed text-[var(--foreground)] md:text-xl">
                      &ldquo;{testimonial.quote}&rdquo;
                    </blockquote>
                    <figcaption className="flex items-center gap-3 font-mono text-xs">
                      <span className="font-semibold text-[var(--foreground)]">{testimonial.clientName}</span>
                      <span>·</span>
                      <span className="text-[var(--muted)]">
                        {testimonial.clientRole}, {testimonial.clientCompany}
                      </span>
                    </figcaption>
                  </figure>
                </FadeIn>
              ) : (
                <p className="text-body">
                  {t.ctaFallback}
                </p>
              )}
            </div>

            <div className="lg:col-span-5">
              <FadeIn yOffset={15} scroll>
                <div className="flex flex-col gap-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-label">{t.classificationLabel}</span>
                    <span className="text-base font-medium text-[var(--foreground)]">{project.category}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-label">{t.releaseLabel}</span>
                    <span className="font-mono text-base font-medium text-[var(--foreground)]">
                      {project.year || "2026"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-label">{t.stackLabel}</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(project.technologies || []).map((tech) => (
                        <span
                          key={tech}
                          className="rounded border border-[var(--border)] bg-[var(--surface-hover)] px-2.5 py-1 font-mono text-xs text-[var(--secondary)]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {assignedTeam.length > 0 && (
                    <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4">
                      <span className="text-label">{t.teamLabel}</span>
                      <div className="flex flex-col gap-2.5">
                        {assignedTeam.map((member) => (
                          <Link
                            key={member.id}
                            href="/people"
                            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[var(--surface-hover)]"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] font-mono text-xs font-bold text-[var(--accent)] transition-colors group-hover:border-[var(--accent)]">
                              {member.initials}
                            </span>
                            <span className="flex flex-col">
                              <span className="text-xs font-medium text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
                                {member.name}
                              </span>
                              <span className="font-mono text-[11px] text-[var(--muted)]">{member.role}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </FadeIn>
            </div>
          </div>
        </Container>
      </section>

      <PageCta />
    </>
  );
}
