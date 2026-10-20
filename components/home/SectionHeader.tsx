import { Fragment } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { WordReveal } from "@/components/animations/WordReveal";
import type { SectionHeaderContent } from "@/lib/home-types";

export function SectionHeader({
  content,
  className = "",
}: {
  content: Omit<SectionHeaderContent, "navLabel">;
  className?: string;
}) {
  return (
    <div className={className}>
      <FadeIn delay={0.1} scroll>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
          {content.eyebrow}
        </div>
        <h2 className="text-section mb-6 leading-tight">
          {content.title.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              <WordReveal text={line} />
            </Fragment>
          ))}
        </h2>
      </FadeIn>

      {content.description && (
        <FadeIn delay={0.2} yOffset={10} scroll>
          <p className="text-body mb-8 max-w-md">{content.description}</p>
        </FadeIn>
      )}

      {content.link && (
        <FadeIn delay={0.3} yOffset={10} scroll>
          <Link
            href={content.link.href}
            className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--foreground)] transition-colors hover:text-[var(--accent)]"
          >
            {content.link.label}
            <ArrowUpRight
              size={14}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </FadeIn>
      )}
    </div>
  );
}
