"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "@/components/ui/SafeImage";
import { ArrowUpRight } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { ImageReveal } from "@/components/animations/ImageReveal";
import { CoverArt } from "@/components/projects/CoverArt";
import type { Project } from "@/lib/types";

interface ProjectsListProps {
  initialProjects: Project[];
}

export function ProjectsList({ initialProjects }: ProjectsListProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    "All",
    ...Array.from(new Set(initialProjects.map((p) => p.category).filter(Boolean))),
  ];

  const filtered =
    selectedCategory === "All"
      ? initialProjects
      : initialProjects.filter((p) => p.category === selectedCategory);

  return (
    <div>
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-16 pb-6 border-b border-[var(--border)]">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-300 ${
              selectedCategory === cat
                ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold shadow-md"
                : "border border-[var(--border)] text-[var(--secondary)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)]"
            }`}
          >
            {cat}
          </button>
        ))}
        <span className="ml-auto text-xs font-mono text-[var(--muted)]">
          Showing {filtered.length} {filtered.length === 1 ? "project" : "projects"}
        </span>
      </div>

      {/* Projects List */}
      <div className="flex flex-col gap-20 md:gap-28">
        {filtered.map((project, index) => {
          const isEven = index % 2 === 0;

          return (
            <FadeIn key={project.id} delay={0.1} yOffset={30} scroll>
              <Link
                href={`/projects/${project.slug}`}
                data-cursor="View"
                data-scene-hover
                data-transition-label={project.title}
                className="group block w-full"
              >
                <div
                  className={`flex flex-col ${
                    isEven ? "lg:flex-row" : "lg:flex-row-reverse"
                  } gap-8 lg:gap-16 items-center`}
                >
                  {/* Visual / Image area */}
                  <ImageReveal className="w-full lg:w-7/12 aspect-[16/10] bg-[var(--surface)] border border-[var(--border)] rounded-2xl group-hover:border-[var(--accent)]/50 transition-colors duration-700 shadow-lg">
                    {project.images && project.images.length > 0 && project.images[0] ? (
                      <Image
                        src={project.images[0]}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <>
                        <CoverArt seed={project.title} label={project.category} />
                        <span className="absolute right-6 top-4 font-mono text-6xl font-bold text-[var(--foreground)]/10 transition-colors duration-700 group-hover:text-[var(--foreground)]/25 md:text-7xl">
                          {project.num || String(index + 1).padStart(2, "0")}
                        </span>
                      </>
                    )}
                  </ImageReveal>

                  {/* Project Info */}
                  <div className="w-full lg:w-5/12 flex flex-col">
                    <div className="flex items-center gap-4 mb-5">
                      <span className="font-mono text-xs text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
                        /{project.num || String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-xs uppercase tracking-widest text-[var(--muted)] font-mono">
                        {project.category}
                      </span>
                      <span className="text-xs text-[var(--muted)] ml-auto font-mono">
                        {project.year || "2026"}
                      </span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-medium text-[var(--foreground)] tracking-tight mb-4 group-hover:text-[var(--accent)] transition-colors duration-300">
                      {project.title}
                    </h2>

                    <p className="text-body text-sm md:text-base leading-relaxed mb-6">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {(project.technologies || []).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-3 py-1 rounded-full border border-[var(--border)] text-[var(--secondary)] bg-[var(--surface)] group-hover:border-[var(--border-hover)] transition-colors duration-300 font-mono"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--foreground)] group-hover:text-[var(--accent)]">
                      Explore Case Study
                      <ArrowUpRight
                        size={15}
                        className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>
              </Link>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
}
