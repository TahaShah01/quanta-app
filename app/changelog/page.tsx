import type { Metadata } from "next";
import { Sparkles, Wrench, RefreshCw, type LucideIcon } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { PageHero } from "@/components/layout/PageHero";
import { PageSection } from "@/components/layout/PageSection";
import { readJSON } from "@/lib/content";
import { getPages } from "@/lib/site";
import type { ChangelogEntry } from "@/lib/types";

export function generateMetadata(): Metadata {
  return getPages().changelog.meta;
}

const typeConfig: Record<
  ChangelogEntry["type"],
  { label: string; icon: LucideIcon; badge: string; dot: string }
> = {
  feature: {
    label: "Feature",
    icon: Sparkles,
    badge: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    dot: "bg-purple-400",
  },
  fix: {
    label: "Fix",
    icon: Wrench,
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
  },
  update: {
    label: "Update",
    icon: RefreshCw,
    badge: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    dot: "bg-sky-400",
  },
};

export default function ChangelogPage() {
  const { changelog } = getPages();
  let entries: ChangelogEntry[] = [];
  try {
    const all = readJSON<ChangelogEntry[]>("changelog.json");
    entries = all
      .filter((e) => e.published)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    entries = [];
  }

  return (
    <>
      <PageHero
        eyebrow={changelog.hero.eyebrow}
        shape="stack"
        lines={changelog.hero.lines}
        body={changelog.hero.body}
        meta={`${String(entries.length).padStart(2, "0")} ${changelog.hero.metaLabel ?? ""}`}
      />

      <PageSection bordered={false}>
        <div className="max-w-3xl relative pl-6 md:pl-10 border-l border-[var(--border)] ml-2 md:ml-4 flex flex-col gap-12">
          {entries.map((entry) => {
            const config = typeConfig[entry.type] || typeConfig.update;
            const Icon = config.icon;

            return (
              <FadeIn key={entry.id} yOffset={20} scroll>
              <div className="relative group">
                <div className="absolute -left-[31px] md:-left-[47px] top-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-[var(--background)] border-2 border-[var(--border)] group-hover:border-[var(--accent)] transition-colors">
                  <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)]/40 p-6 md:p-8 hover:border-[var(--border-hover)] transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono uppercase tracking-wider border ${config.badge}`}
                      >
                        <Icon size={12} />
                        {config.label}
                      </span>
                      <h2 className="text-xl md:text-2xl font-medium text-[var(--foreground)]">
                        {entry.title}
                      </h2>
                    </div>

                    <time className="text-xs font-mono text-[var(--muted)]">
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>

                  <p className="text-sm md:text-base text-[var(--secondary)] leading-relaxed">
                    {entry.description}
                  </p>
                </div>
              </div>
              </FadeIn>
            );
          })}
        </div>
      </PageSection>
    </>
  );
}
