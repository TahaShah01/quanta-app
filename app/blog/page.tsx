import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { TiltCard } from "@/components/animations/TiltCard";
import { PageHero } from "@/components/layout/PageHero";
import { PageSection } from "@/components/layout/PageSection";
import { PageCta } from "@/components/layout/PageCta";
import { getPages, getPosts } from "@/lib/site";

export function generateMetadata(): Metadata {
  return getPages().blog.meta;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogPage() {
  const [featured, ...others] = getPosts();
  const { blog } = getPages();

  return (
    <>
      <PageHero
        eyebrow={blog.hero.eyebrow}
        shape="lattice"
        lines={blog.hero.lines}
        body={blog.hero.body}
      />

      <PageSection bordered={false}>
        {!featured ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-20 text-center">
            <p className="text-[var(--secondary)]">
              {blog.emptyMessage}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            <FadeIn yOffset={25} scroll>
              <Link
                href={`/blog/${featured.slug}`}
                className="group block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 transition-all duration-500 hover:border-[var(--accent)]/50 md:p-12"
              >
                <div className="flex flex-col gap-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-2.5 py-0.5 font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
                      {blog.featuredLabel}
                    </span>
                    {(featured.tags || []).map((tag) => (
                      <span key={tag} className="font-mono text-xs text-[var(--muted)]">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <h2 className="text-section transition-colors group-hover:text-[var(--accent)]">
                    {featured.title}
                  </h2>

                  <p className="text-body max-w-3xl">{featured.excerpt}</p>

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-6 font-mono text-xs text-[var(--muted)]">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1.5 text-[var(--foreground)]">
                        <User size={13} className="text-[var(--accent)]" />
                        {featured.author}
                        {featured.authorRole && ` (${featured.authorRole})`}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        {formatDate(featured.publishedAt)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} />
                        {featured.readTime} min read
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-medium text-[var(--accent)] transition-transform group-hover:translate-x-1">
                      {blog.readLabel} <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            </FadeIn>

            {others.length > 0 && (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {others.map((post, i) => (
                  <FadeIn key={post.slug} delay={i * 0.06} yOffset={20} scroll className="h-full">
                    <TiltCard className="h-full rounded-xl">
                    <Link
                      href={`/blog/${post.slug}`}
                      data-scene-hover
                      className="group flex h-full flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 transition-colors duration-300 hover:border-[var(--accent)]/50"
                    >
                      <div>
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          {(post.tags || []).slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="font-mono text-xs uppercase tracking-wider text-[var(--muted)]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <h3 className="text-subsection mb-3 transition-colors group-hover:text-[var(--accent)]">
                          {post.title}
                        </h3>
                        <p className="line-clamp-3 text-sm leading-relaxed text-[var(--secondary)]">
                          {post.excerpt}
                        </p>
                      </div>

                      <div className="mt-8 flex items-center justify-between border-t border-[var(--border)] pt-6 font-mono text-xs text-[var(--muted)]">
                        <span>
                          {post.author} · {post.readTime} min read
                        </span>
                        <ArrowRight
                          size={14}
                          className="text-[var(--secondary)] transition-all group-hover:translate-x-1 group-hover:text-[var(--accent)]"
                        />
                      </div>
                    </Link>
                    </TiltCard>
                  </FadeIn>
                ))}
              </div>
            )}
          </div>
        )}
      </PageSection>

      <PageCta />
    </>
  );
}
